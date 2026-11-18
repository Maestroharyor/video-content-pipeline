// Gaze features per frame for lens-contact detection. For each image: Vision face landmarks (revision 3) give the
// pupils and the eye outlines; head pose (yaw, pitch, roll) comes from the face observation. Output CSV:
// file,px,py,lid,yaw,pitch,roll,dark
//   px/py  = mean pupil position inside the eye outline's box (0..1, x from the outer to the inner corner is not
//            assumed: plain image x), both eyes averaged
//   lid    = eye box height / width (openness)
//   dark   = centroid height of the darkest 30% of pixels inside the outline (the earlier measure, kept for comparison)
import Foundation
import Vision
import CoreGraphics
import ImageIO

func load(_ url: URL) -> CGImage? {
  guard let src = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
  return CGImageSourceCreateImageAtIndex(src, 0, nil)
}
func gray(_ img: CGImage) -> (UnsafeMutablePointer<UInt8>, Int, Int) {
  let w = img.width, h = img.height
  let buf = UnsafeMutablePointer<UInt8>.allocate(capacity: w * h)
  let ctx = CGContext(data: buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                      space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue)!
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  return (buf, w, h)
}
let dir = URL(fileURLWithPath: CommandLine.arguments[1])
let files = try FileManager.default.contentsOfDirectory(atPath: dir.path).filter { $0.hasSuffix(".jpg") }.sorted()
print("file,px,py,lid,yaw,pitch,roll,dark")
for f in files {
  guard let img = load(dir.appendingPathComponent(f)) else { continue }
  let req = VNDetectFaceLandmarksRequest()
  req.revision = VNDetectFaceLandmarksRequestRevision3
  try? VNImageRequestHandler(cgImage: img, options: [:]).perform([req])
  guard let face = req.results?.first, let lm = face.landmarks else { print("\(f),,,,,,,"); continue }
  let W = img.width, H = img.height
  let pts = { (r: VNFaceLandmarkRegion2D) -> [CGPoint] in r.pointsInImage(imageSize: CGSize(width: W, height: H)).map { CGPoint(x: $0.x, y: CGFloat(H) - $0.y) } }
  var pxs: [Double] = [], pys: [Double] = [], lids: [Double] = [], darks: [Double] = []
  let (px, gw, gh) = gray(img)
  for (eye, pupil) in [(lm.leftEye, lm.leftPupil), (lm.rightEye, lm.rightPupil)] {
    guard let eye = eye else { continue }
    let e = pts(eye)
    let minX = e.map(\.x).min()!, maxX = e.map(\.x).max()!, minY = e.map(\.y).min()!, maxY = e.map(\.y).max()!
    let bw = maxX - minX, bh = maxY - minY
    if bw < 6 || bh < 2 { continue }
    lids.append(Double(bh / bw))
    if let pupil = pupil, let p = pts(pupil).first {
      pxs.append(Double((p.x - minX) / bw)); pys.append(Double((p.y - minY) / bh))
    }
    let path = CGMutablePath(); path.addLines(between: e); path.closeSubpath()
    var s: [(UInt8, CGFloat)] = []
    for y in Int(minY)...Int(maxY) { for x in Int(minX)...Int(maxX) where x >= 0 && y >= 0 && x < gw && y < gh {
      if path.contains(CGPoint(x: CGFloat(x) + 0.5, y: CGFloat(y) + 0.5)) { s.append((px[y * gw + x], CGFloat(y))) } } }
    if s.count > 10 { s.sort { $0.0 < $1.0 }; let d = s.prefix(max(1, s.count * 3 / 10))
      darks.append((d.map { Double($0.1) }.reduce(0, +) / Double(d.count) - Double(minY)) / Double(bh)) }
  }
  px.deallocate()
  let avg = { (a: [Double]) -> String in a.isEmpty ? "" : String(format: "%.4f", a.reduce(0, +) / Double(a.count)) }
  let deg = { (n: NSNumber?) -> String in n == nil ? "" : String(format: "%.2f", n!.doubleValue * 180 / .pi) }
  print("\(f),\(avg(pxs)),\(avg(pys)),\(avg(lids)),\(deg(face.yaw)),\(deg(face.pitch)),\(deg(face.roll)),\(avg(darks))")
}
