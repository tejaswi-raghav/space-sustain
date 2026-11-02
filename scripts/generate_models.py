"""Generate simple, editable Wavefront OBJ models for the SpaceSustain demo."""
from pathlib import Path
from math import cos, sin, pi
OUT = Path(__file__).resolve().parents[1] / 'dist' / 'models'
OUT.mkdir(parents=True, exist_ok=True)
class Model:
    def __init__(self): self.v=[]; self.f=[]
    def vertex(self,x,y,z): self.v.append((x,y,z)); return len(self.v)
    def face(self,*idx): self.f.append(idx)
    def extrude(self, points, depth=.16):
        n=len(points); a=[self.vertex(x,y,-depth/2) for x,y in points]; b=[self.vertex(x,y,depth/2) for x,y in points]
        self.face(*reversed(a)); self.face(*b)
        for i in range(n): j=(i+1)%n; self.face(a[i],a[j],b[j],b[i])
    def cylinder(self,r1,r2,y1,y2,sides=24):
        a=[self.vertex(r1*cos(2*pi*i/sides),y1,r1*sin(2*pi*i/sides)) for i in range(sides)]
        b=[self.vertex(r2*cos(2*pi*i/sides),y2,r2*sin(2*pi*i/sides)) for i in range(sides)]
        self.face(*reversed(a)); self.face(*b)
        for i in range(sides): j=(i+1)%sides; self.face(a[i],a[j],b[j],b[i])
    def save(self,path):
        with open(OUT/path,'w') as f:
            f.write('# SpaceSustain original low-poly concept model\n')
            for x,y,z in self.v:f.write(f'v {x:.5f} {y:.5f} {z:.5f}\n')
            for face in self.f:f.write('f '+' '.join(map(str,face))+'\n')
tee=Model();tee.extrude([(-1.05,1.4),(-.45,1.65),(-.28,1.3),(.28,1.3),(.45,1.65),(1.05,1.4),(1.42,.6),(.95,.42),(.78,.75),(.78,-1.5),(-.78,-1.5),(-.78,.75),(-.95,.42),(-1.42,.6)]);tee.save('terraweave-tee.obj')
bottle=Model();bottle.cylinder(.68,.61,-1.3,1.1);bottle.cylinder(.36,.36,1.1,1.4);bottle.cylinder(.44,.44,1.4,1.64);bottle.save('orbit-refill-bottle.obj')
lamp=Model();lamp.cylinder(.82,.72,-1.5,-1.3);lamp.cylinder(.08,.08,-1.3,.9);lamp.cylinder(.98,.35,.65,1.5);lamp.save('canopy-desk-lamp.obj')
print('Generated 3 OBJ models in', OUT)
