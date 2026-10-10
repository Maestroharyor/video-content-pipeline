defineSlide({ slug: '58-health-checks', template: 'code', data: {
  eyebrow: '03 · Monitoring', accent: 'o', h1: 'Know when<br>it <em>fails</em>', file: 'k8s/deployment.yaml',
  lines: [
    '<span class="f">readinessProbe</span>:',
    '  <span class="f">httpGet</span>: { path: <span class="s">/healthz</span>, port: <span class="n">3000</span> }',
    '  <span class="f">periodSeconds</span>: <span class="n">10</span>',
    '<span class="f">livenessProbe</span>:',
    '  <span class="f">httpGet</span>: { path: <span class="s">/livez</span>, port: <span class="n">3000</span> }',
    '  <span class="f">failureThreshold</span>: <span class="n">3</span>',
  ],
  note: 'Alert: 5xx rate above 5% for 5 minutes → page the on-call engineer',
} });
