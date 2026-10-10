/* Cuts the person out of a photo or video frame: RGBA PNG with a transparent background (thumbnails, overlays). macOS only (Apple Vision).
   Usage: swift scripts/cutout.swift <in.png|jpg> <out.png> [--mode both|person|subject] [--open 9] [--choke 1.5] [--feather 1.2] [--crop]
   person  = VNGeneratePersonSegmentationRequest (accurate): people only, so a chair or desk behind them is dropped.
   subject = VNGenerateForegroundInstanceMaskRequest: whatever stands out (sharper edge, but takes props with it).
   both    = the two masks multiplied (default): what one lets through by mistake the other usually removes.
   --open removes spurs and specks thinner than twice that many pixels (background that leaked along an arm), before
   --choke pulls the edge in by that many pixels (kills background halos), --feather then blurs it; --crop trims to the person's bounding box. */
import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins

var args = Array(CommandLine.arguments.dropFirst()), mode = "both", feather = 1.2, choke = 0.0, open = 0.0, crop = false, files: [String] = []
while !args.isEmpty { let a = args.removeFirst()
  if a == "--mode" { mode = args.removeFirst() } else if a == "--feather" { feather = Double(args.removeFirst()) ?? feather } else if a == "--choke" { choke = Double(args.removeFirst()) ?? choke } else if a == "--open" { open = Double(args.removeFirst()) ?? open } else if a == "--crop" { crop = true } else { files.append(a) } }
guard files.count == 2, let src = CIImage(contentsOf: URL(fileURLWithPath: files[0])) else { FileHandle.standardError.write("usage: cutout.swift <in> <out.png> [--mode both|person|subject] [--open px] [--choke px] [--feather px] [--crop]\n".data(using: .utf8)!); exit(1) }

let handler = VNImageRequestHandler(ciImage: src, options: [:])
func subjectMask() throws -> CIImage {
  let req = VNGenerateForegroundInstanceMaskRequest()
  try handler.perform([req])
  guard let obs = req.results?.first else { fatalError("no subject found") }
  return CIImage(cvPixelBuffer: try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler))
}
func personMask() throws -> CIImage {
  let req = VNGeneratePersonSegmentationRequest()
  req.qualityLevel = .accurate
  req.outputPixelFormat = kCVPixelFormatType_OneComponent8
  try handler.perform([req])
  guard let buf = req.results?.first?.pixelBuffer else { fatalError("no person found") }
  let m = CIImage(cvPixelBuffer: buf)
  return m.transformed(by: CGAffineTransform(scaleX: src.extent.width / m.extent.width, y: src.extent.height / m.extent.height))
}
var mask = mode == "subject" ? try subjectMask() : try personMask()
if mode == "both" { mask = mask.applyingFilter("CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: try subjectMask()]) }
if open > 0 { mask = mask.clampedToExtent().applyingFilter("CIMorphologyMinimum", parameters: [kCIInputRadiusKey: open]).applyingFilter("CIMorphologyMaximum", parameters: [kCIInputRadiusKey: open]).cropped(to: src.extent) }
if choke > 0 { mask = mask.clampedToExtent().applyingFilter("CIMorphologyMinimum", parameters: [kCIInputRadiusKey: choke]).cropped(to: src.extent) }
if feather > 0 { mask = mask.clampedToExtent().applyingGaussianBlur(sigma: feather).cropped(to: src.extent) }

let blend = CIFilter.blendWithMask()
blend.inputImage = src
blend.backgroundImage = CIImage(color: .clear).cropped(to: src.extent)
blend.maskImage = mask
var out = blend.outputImage!
let ctx = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])

if crop {   // bounding box of mask > 0.5, found on a small copy
  let w = 256, h = Int(256 * src.extent.height / src.extent.width), s = CGFloat(w) / src.extent.width
  var px = [UInt8](repeating: 0, count: w * h * 4)
  ctx.render(mask.transformed(by: CGAffineTransform(scaleX: s, y: s)), toBitmap: &px, rowBytes: w * 4, bounds: CGRect(x: 0, y: 0, width: w, height: h), format: .RGBA8, colorSpace: nil)
  var x0 = w, x1 = 0, y0 = h, y1 = 0
  for y in 0..<h { for x in 0..<w where px[(y * w + x) * 4] > 127 { x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y) } }
  if x1 > x0 {   // bitmap rows run top-down, CIImage y runs bottom-up
    let r = CGRect(x: CGFloat(x0 - 2) / s, y: src.extent.height - CGFloat(y1 + 3) / s, width: CGFloat(x1 - x0 + 5) / s, height: CGFloat(y1 - y0 + 5) / s).intersection(src.extent).integral
    out = out.cropped(to: r).transformed(by: CGAffineTransform(translationX: -r.minX, y: -r.minY))
  }
}
try ctx.writePNGRepresentation(of: out, to: URL(fileURLWithPath: files[1]), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("cutout", mode, files[1], Int(out.extent.width), "x", Int(out.extent.height))
