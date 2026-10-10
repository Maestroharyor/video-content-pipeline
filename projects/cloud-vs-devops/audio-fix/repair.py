import numpy as np, sys
from scipy.signal import fftconvolve, butter, sosfilt
S=sys.argv[1]; sr=48000
x=np.fromfile(S+'/vo.f32',dtype=np.float32).astype(np.float64)
rng=np.random.default_rng(7)
def pink(n):
    w=rng.standard_normal(n); f=np.fft.rfft(w); k=np.arange(len(f)); k[0]=1
    y=np.fft.irfft(f/np.sqrt(k),n); return y
def band(y,lo,hi): return sosfilt(butter(4,[lo,hi],'bandpass',fs=sr,output='sos'),y)
def at_db(y,db): return y*(10**(db/20))/np.sqrt((y**2).mean())
tone=at_db(band(pink(len(x)),100,4000),-62)
# dead mask on 5 ms windows, smoothed into a gain curve with ~8 ms raised-cosine edges
win=240; n=len(x)//win
e=20*np.log10(np.sqrt((x[:n*win].reshape(n,win)**2).mean(1))+1e-12)
dead=np.repeat((e<-70).astype(float),win); dead=np.pad(dead,(0,len(x)-len(dead)))
k=np.hanning(int(0.008*sr)); k/=k.sum(); g=np.clip(fftconvolve(dead,k,'same'),0,1)
# A: constant bed
A=x+tone
# B: gap-only fill, a bit louder than the bed since speech never has to mask it
B=x+at_db(band(pink(len(x)),120,5000),-57)*g
# C: small-room reverb (8 ms pre-delay, ~0.35 s RT60, darkened) mixed low, plus the bed
L=int(0.45*sr); t=np.arange(L)/sr
ir=rng.standard_normal(L)*np.exp(-6.9*t/0.35); ir=sosfilt(butter(2,5000,'low',fs=sr,output='sos'),ir)
ir=np.concatenate([np.zeros(int(0.008*sr)),ir]); ir/=np.sqrt((ir**2).sum())
wet=fftconvolve(x,ir)[:len(x)]
C=x+wet*10**(-16/20)+tone
for name,y in (('A-roomtone',A),('B-gapfill',B),('C-room-reverb',C)):
    pk=np.abs(y).max(); y=y/pk*0.95 if pk>0.95 else y
    y.astype(np.float32).tofile(f'{S}/vo-{name}.f32'); print(name,'peak dB',round(20*np.log10(np.abs(y).max()),2))
