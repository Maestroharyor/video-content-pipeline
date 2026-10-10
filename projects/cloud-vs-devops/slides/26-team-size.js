defineSlide({ slug: '26-team-size', template: 'lanes', data: {
  emoji: [{ e: 'hot_face', x: 1580, y: 630, size: 130 }],
  eyebrow: 'The overlap', accent: 't', h1: 'Team size <em>decides</em>',
  left: { role: 'Cloud team', cls: 'b', pre: true, team: [passet('avatars/team1.svg'), passet('avatars/team2.svg'), passet('avatars/team3.svg')], avatar: { src: passet('avatars/cloud-hand.svg'), name: 'Cloud' } },
  right: { role: 'DevOps team', cls: 'o', pre: true, team: [passet('avatars/team4.svg'), passet('avatars/team5.svg'), passet('avatars/team6.svg')], avatar: { src: passet('avatars/devops-hand.svg'), name: 'DevOps' } },
  mid: { cls: 't', label: 'Small company', text: 'One engineer handles both roles', avatar: { src: passet('avatars/devops-waveLongArm.svg') } },
} });
