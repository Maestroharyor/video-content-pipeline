# AWS resources you forget to turn off
## Cue sheet

Voiceover runtime 1:57. Twenty-two slides, each 6.00s (5.00s motion + 1.00s static hold on the final frame).
Deck total 2:12, so there is roughly 15s of slack to absorb in the edit.

Render spec: 1080x1920, 30fps. MP4 at full resolution (h264, crf 19). GIF at 540x960.
Slide 22 carries an AAC audio bed: pops at 1.50s / 2.10s / 2.70s / 3.30s, shimmer sweep 4.30-5.02s.

| # | File | Clip | VO window | Line it covers |
|---|------|------|-----------|----------------|
| 01 | 01-title-aws-bill-climbing | 6s | 0:00-0:06 | "you launched an AWS server for a quick project, and now your AWS bill is climbing" |
| 02 | 02-what-is-running | 6s | 0:06-0:09 | "the scary part, you might not even realize what is running" |
| 03 | 03-three-resources | 6s | 0:09-0:14 | "three AWS resources or services that developers often forget to turn off or clean up" |
| 04 | 04-ec2-spin-up | 6s | 0:14-0:22 | "Number one ... EC2. You spin up an EC2 instance for development or testing, or even a quick demo of your AI project" |
| 05 | 05-running-means-paying | 6s | 0:22-0:26 | "as long as that instance is running, you're paying for compute" |
| 06 | 06-idle-fleet | 6s | 0:26-0:31 | "it gets worse when you have multiple test servers sitting there doing nothing" |
| 07 | 07-misconception-stopped | 6s | 0:31-0:35 | "here's a misconception ... even when you pause your EC2 instance" |
| 08 | 08-ebs-still-attached | 6s | 0:35-0:41 | "you are paying for the EBS storage that is still attached ... you might think that you are safe" |
| 09 | 09-terminate-but-setup | 6s | 0:41-0:45 | "but what about all the setups that you need to do if you terminate the instance?" |
| 10 | 10-user-data-script | 6s | 0:45-0:53 | "you can have a user script which handles all of the basic setups ... whenever you start a new EC2 instance" |
| 11 | 11-check-ec2-dashboard | 6s | 0:53-0:58 | "before you finish your project, check your EC2 dashboard. Stop or terminate anything you are not using" |
| 12 | 12-rds-intro | 6s | 0:58-1:02 | "the next one is RDS. And this one is very easy to overlook" |
| 13 | 13-ec2-gone-db-running | 6s | 1:02-1:07 | "you might terminate your EC2 instance or your EBS volume, but your database is still running" |
| 14 | 14-rds-keeps-charging | 6s | 1:07-1:12 | "running RDS databases can continue to charge you because they are a separate resource" |
| 15 | 15-stop-and-clean-up | 6s | 1:12-1:18 | "if that development database isn't being used anymore, you might just want to stop and clean it up" |
| 16 | 16-nat-intro | 6s | 1:18-1:21 | "number three is the one that can really surprise you. NAT gateway" |
| 17 | 17-vpc-diagram | 6s | 1:21-1:29 | "you create one while setting up your VPC ... private servers need internet access. And then you completely forget it exists" |
| 18 | 18-nat-ongoing-costs | 6s | 1:29-1:33 | "NAT gateways have ongoing costs, including hourly and data processing charges" |
| 19 | 19-tiny-traffic-big-charge | 6s | 1:33-1:39 | "very little application traffic and then wonder why you're getting a networking charge" |
| 20 | 20-checklist-before-you-leave | 6s | 1:39-1:49 | "before you walk away ... check your EC2 instances and the attached volumes, your RDS databases and your NAT gateways" |
| 21 | 21-not-using-not-paying | 6s | 1:49-1:57 | "check what is actually running. Because with AWS, I'm not using it doesn't mean I'm not paying for it" |
| 22 | 22-outro-follow | 6s | 1:57-2:03 | "follow for more" |

## Notes for the edit

Slides 02, 09, 12 and 16 sit under 3-4s reads; their motion resolves by t≈0.8 (4.0s), so each can be cut early.
Slides 04, 10, 17, 20 and 21 sit under 8-10s reads; hold the final frame or let the clip breathe.
Slides 07, 11 and 15 run a full console interaction (menu → item → confirmation modal → status change) that ends
by 4.4s and fades the pointer before the hold, so the held frame is clean.

## Design system

- Background #0A0E18, panels #111A2B, borders #23304A (same as the previous deck)
- InterDisplay for headlines, Inter for body, JetBrains Mono for badges and ids, Open Sans inside the AWS console mock
- Locked grid: eyebrow y=132, headline y=206, content y=455, footnote y=1740
- Colour language for this deck: orange = AWS/EC2, amber = still-billing warnings, rose = cost surprises, blue = RDS,
  violet = VPC/NAT, green = fixes/checks, teal = title/outro
- AWS console mock 960x720, light mode, Cloudscape styling: dark nav #0F1B2A, blue #0972D3, orange primary #FF9900,
  status indicators green/amber/grey
