# Headless: blender --background --factory-startup --python build_assets.py -- <outdir>
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix, Euler

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp"
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def hexc(h, a=1.0):
    h = h.lstrip('#'); r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), a)

MATS = {}
def mat(name, hx, rough=0.85, metal=0.0, emit=None):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = hexc(hx)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = hexc(emit)
        b.inputs["Emission Strength"].default_value = 2.0
    MATS[name] = m; return m

YEL = mat("duck_yellow", "#FFC51D"); YEL_SH = mat("duck_yellow_shadow", "#E9A812")
BEAK = mat("beak", "#F9790B"); RIDGE = mat("beak_ridge", "#E79D0A"); MOUTH = mat("mouth", "#E55D48")
HAT = mat("fedora", "#814E21"); BAND = mat("hatband", "#58361D"); BRASS = mat("brass", "#C9A04A", 0.5, 0.6)
BAG = mat("satchel", "#7C4A1F"); BAG_SH = mat("satchel_shadow", "#502B10")
INK = mat("ink", "#1A0E04", 0.3); WHITE = mat("white", "#FFFFFF", 0.4)
GOLD = mat("gold", "#F2B533", 0.35, 0.9); TEAL = mat("relic_teal", "#01A5AF", 0.2, 0.1)
STONE = mat("sandstone", "#C29A62"); STONE_DK = mat("sandstone_dark", "#8E6B40")
MOSS = mat("moss", "#5E7F3A"); ROCK = mat("boulder", "#8A7055"); METAL = mat("iron", "#7B7F86", 0.45, 0.8)
FLAME = mat("flame", "#FFB23A", 0.5, 0.0, emit="#FF9A1F")

def smooth(o, on=True):
    if o.type == 'MESH':
        o.data.polygons.foreach_set("use_smooth", [on] * len(o.data.polygons))

def finish(o, name, m, sm=True):
    o.name = name; o.data.name = name
    o.data.materials.clear(); o.data.materials.append(m); smooth(o, sm); return o

def sphere(name, m, loc, scale=(1,1,1), r=1.0, seg=24, rings=14, rot=(0,0,0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=loc, rotation=rot)
    o = bpy.context.active_object; o.scale = scale; return finish(o, name, m)

def cyl(name, m, loc, r=1, depth=1, verts=24, rot=(0,0,0), scale=(1,1,1), sm=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object; o.scale = scale; return finish(o, name, m, sm)

def cone(name, m, loc, r1, r2, depth, verts=24, rot=(0,0,0), scale=(1,1,1), sm=True):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object; o.scale = scale; return finish(o, name, m, sm)

def cube(name, m, loc, size, rot=(0,0,0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.scale = size; finish(o, name, m, False)
    if bevel:
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        md = o.modifiers.new("bev", 'BEVEL'); md.width = bevel; md.segments = 2
        smooth(o, True)
        o.data.shade_auto_smooth if False else None
    return o

def torus(name, m, loc, R, r, rot=(0,0,0), scale=(1,1,1), majs=32, mins=10):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=majs, minor_segments=mins, location=loc, rotation=rot)
    o = bpy.context.active_object; o.scale = scale; return finish(o, name, m)

def empty(name, loc=(0,0,0)):
    o = bpy.data.objects.new(name, None); o.location = loc
    scene.collection.objects.link(o); return o

def parent(child, p):
    bpy.context.view_layer.update()
    mw = child.matrix_world.copy(); child.parent = p; child.matrix_world = mw

def export(root, fname):
    bpy.ops.object.select_all(action='DESELECT')
    def sel(o):
        o.select_set(True)
        for c in o.children: sel(c)
    sel(root)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, fname), export_format='GLB',
        use_selection=True, export_apply=True, export_yup=True, export_materials='EXPORT',
        export_normals=True)

# ---------------- Duck Jones ----------------
# Blender: Z up, duck faces -Y (front view). Duck's right side = -X = viewer's left.
D = math.radians
duck = empty("DuckJones")
body = sphere("Body", YEL, (0, 0, 0.43), (0.36, 0.34, 0.38)); parent(body, duck)
belly = sphere("BellyShade", YEL_SH, (0, 0.03, 0.38), (0.345, 0.32, 0.345)); parent(belly, duck)
tail = cone("Tail", YEL, (0, 0.36, 0.55), 0.12, 0.0, 0.22, rot=(D(-70), 0, 0)); parent(tail, duck)
for side, nm in ((-1, "R"), (1, "L")):
    f = sphere(f"Foot{nm}", BEAK, (0.15 * side, -0.10, 0.04), (0.12, 0.17, 0.045)); parent(f, duck)
    w = sphere(f"Wing{nm}", YEL, (0.35 * side, 0.02, 0.47), (0.08, 0.19, 0.15), rot=(0, D(-18 * side), 0))
    parent(w, duck)

head = empty("HeadPivot", (0, 0, 0.78)); parent(head, duck)
h = sphere("Head", YEL, (0, -0.03, 1.07), (0.40, 0.37, 0.37), seg=32, rings=18); parent(h, head)
cheek = sphere("Neck", YEL, (0, -0.02, 0.84), (0.25, 0.24, 0.16)); parent(cheek, head)
for side in (-1, 1):
    tag = "R" if side < 0 else "L"
    e = sphere(f"Eye{tag}", WHITE, (0.125 * side, -0.31, 1.13), (0.10, 0.06, 0.125)); parent(e, head)
    p = sphere(f"Pupil{tag}", INK, (0.12 * side, -0.355, 1.12), (0.068, 0.035, 0.088)); parent(p, head)
    # highlight upper-left as seen by the viewer (viewer's left = -X)
    s = sphere(f"Shine{tag}", WHITE, (0.12 * side - 0.025, -0.388, 1.155), (0.022, 0.012, 0.024), seg=10, rings=6)
    parent(s, head)
    br = torus(f"Brow{tag}", INK, (0.125 * side, -0.29, 1.29), 0.07, 0.012, rot=(D(90), 0, 0),
               scale=(1, 1, 0.6), majs=16, mins=6)
    # keep only the upper arc of the brow
    bm = bmesh.new(); bm.from_mesh(br.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < 0.02], context='VERTS')
    bm.to_mesh(br.data); bm.free(); parent(br, head)
up = sphere("BeakUpper", BEAK, (0, -0.42, 1.01), (0.21, 0.15, 0.055)); parent(up, head)
ridge = sphere("BeakRidge", RIDGE, (0, -0.42, 1.045), (0.13, 0.11, 0.03)); parent(ridge, head)
mouth = sphere("Mouth", MOUTH, (0, -0.40, 0.95), (0.16, 0.12, 0.055)); parent(mouth, head)
lo = sphere("BeakLower", BEAK, (0, -0.37, 0.905), (0.17, 0.13, 0.04)); parent(lo, head)

hat = empty("Hat", (0, -0.02, 1.36)); parent(hat, head)
brim = cyl("HatBrim", HAT, (0, -0.02, 1.36), 0.56, 0.035, verts=40, scale=(1, 0.92, 1)); parent(brim, hat)
# curl the brim edges up a touch
bm = bmesh.new(); bm.from_mesh(brim.data)
for v in bm.verts:
    rr = math.hypot(v.co.x, v.co.y)
    v.co.z += 0.10 * max(0, rr - 0.35) * (abs(v.co.x) / max(rr, 1e-6)) * 2.5
bm.to_mesh(brim.data); bm.free()
crown = cone("HatCrown", HAT, (0, -0.02, 1.53), 0.31, 0.25, 0.32, verts=32, scale=(1, 0.9, 1)); parent(crown, hat)
# pinch: dent the top and the front
bm = bmesh.new(); bm.from_mesh(crown.data)
for v in bm.verts:
    if v.co.z > 0.1:
        v.co.z -= 0.06 * math.exp(-(v.co.x ** 2) / 0.02)
        if v.co.y < -0.1: v.co.x *= 0.8
bm.to_mesh(crown.data); bm.free()
band = cyl("HatBand", BAND, (0, -0.02, 1.42), 0.315, 0.08, verts=32, scale=(1, 0.9, 1)); parent(band, hat)
buckle = cube("HatBuckle", BRASS, (0.22, -0.24, 1.42), (0.05, 0.02, 0.06), rot=(0, 0, D(40)), bevel=0.005)
parent(buckle, hat)
hat.rotation_euler = (D(-4), D(7), 0)

# Satchel on the duck's right (-X, viewer's left), strap across the chest to the left shoulder.
bagroot = empty("Satchel", (-0.36, -0.24, 0.30)); parent(bagroot, duck)
bag = cube("SatchelBag", BAG, (-0.36, -0.24, 0.30), (0.27, 0.15, 0.25), bevel=0.045); parent(bag, bagroot)
flap = cube("SatchelFlap", BAG_SH, (-0.36, -0.32, 0.36), (0.28, 0.025, 0.15), bevel=0.012); parent(flap, bagroot)
bb = cube("SatchelBuckle", BRASS, (-0.36, -0.34, 0.30), (0.05, 0.02, 0.06), bevel=0.006); parent(bb, bagroot)
strap = torus("Strap", BAG, (0, 0, 0.52), 0.40, 0.026, rot=(0, D(-42), 0), scale=(1.0, 0.92, 1.0)); parent(strap, duck)
sb = cube("StrapBuckle", BRASS, (0, -0.375, 0.52), (0.07, 0.025, 0.06), rot=(0, D(-42), 0), bevel=0.006)
parent(sb, duck)
export(duck, "duck.glb")

# ---------------- Temple props ----------------
props = empty("Props")
def group(name, loc=(0, 0, 0)):
    g = empty(name, loc); parent(g, props); return g

pil = group("Pillar")
for o in (cyl("PillarShaft", STONE, (0, 0, 2.1), 0.42, 3.6, verts=14, sm=False),
          cube("PillarBase", STONE_DK, (0, 0, 0.15), (1.1, 1.1, 0.3), bevel=0.04),
          cube("PillarCap", STONE_DK, (0, 0, 4.05), (1.1, 1.1, 0.3), bevel=0.04),
          cyl("PillarMoss", MOSS, (0, 0, 0.55), 0.435, 0.25, verts=14, sm=False)):
    parent(o, pil)

idol = group("Idol")
for o in (cyl("IdolBase", STONE_DK, (0, 0, 0.12), 0.32, 0.24, verts=8, sm=False),
          sphere("IdolBody", GOLD, (0, 0, 0.42), (0.20, 0.18, 0.2)),
          sphere("IdolHead", GOLD, (0, -0.02, 0.68), (0.16, 0.15, 0.15)),
          sphere("IdolBeak", GOLD, (0, -0.17, 0.65), (0.09, 0.07, 0.03)),
          cyl("IdolBrim", GOLD, (0, -0.02, 0.80), 0.22, 0.02, verts=24),
          cone("IdolCrown", GOLD, (0, -0.02, 0.87), 0.13, 0.11, 0.13, verts=24),
          sphere("IdolEyeL", TEAL, (0.06, -0.14, 0.71), (0.03, 0.02, 0.03), seg=10, rings=6),
          sphere("IdolEyeR", TEAL, (-0.06, -0.14, 0.71), (0.03, 0.02, 0.03), seg=10, rings=6)):
    parent(o, idol)

coin = group("Coin")
for o in (cyl("CoinFace", GOLD, (0, 0, 0), 0.24, 0.05, verts=24, rot=(D(90), 0, 0), sm=False),
          torus("CoinRim", GOLD, (0, 0, 0), 0.22, 0.025, rot=(D(90), 0, 0), majs=24, mins=6),
          cube("CoinMark", BRASS, (0, -0.03, 0), (0.07, 0.02, 0.14), bevel=0.01)):
    parent(o, coin)

relic = group("Relic")
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.22, location=(0, 0, 0))
g = finish(bpy.context.active_object, "RelicGem", TEAL, sm=False); g.scale = (0.8, 0.8, 1.25); parent(g, relic)

boul = group("Boulder")
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.0, location=(0, 0, 0))
b = finish(bpy.context.active_object, "BoulderRock", ROCK, sm=True)
tex = bpy.data.textures.new("bnoise", 'CLOUDS'); tex.noise_scale = 0.6
md = b.modifiers.new("disp", 'DISPLACE'); md.texture = tex; md.strength = 0.18; md.mid_level = 0.5
parent(b, boul)
for i, (x, y, z) in enumerate(((0.3, -0.85, 0.3), (-0.5, 0.2, 0.75), (0.7, 0.4, -0.4))):
    sphere(f"BoulderMoss{i}", MOSS, (x, y, z), (0.28, 0.28, 0.18), seg=10, rings=6)
    parent(bpy.context.active_object, boul)

sp = group("Spikes")
parent(cube("SpikePlate", STONE_DK, (0, 0, 0.04), (1.7, 1.3, 0.08), bevel=0.02), sp)
for ix in range(4):
    for iy in range(3):
        parent(cone(f"Spike{ix}{iy}", METAL, (-0.6 + ix * 0.4, -0.4 + iy * 0.4, 0.3), 0.11, 0.0, 0.46, verts=6, sm=False), sp)

blk = group("Rubble")
parent(cyl("RubbleColumn", STONE, (0, 0, 0.42), 0.42, 1.7, verts=14, rot=(0, D(90), D(8)), sm=False), blk)
parent(cube("RubbleChunk", STONE_DK, (0.55, -0.3, 0.25), (0.5, 0.45, 0.5), rot=(D(12), D(20), D(30)), bevel=0.04), blk)
parent(cube("RubbleChunk2", STONE, (-0.6, 0.35, 0.2), (0.4, 0.4, 0.4), rot=(D(-10), D(35), D(5)), bevel=0.04), blk)

tor = group("Torch")
for o in (cyl("TorchStick", BAND, (0, 0, 0.35), 0.04, 0.7, verts=8, sm=False),
          cone("TorchCup", METAL, (0, 0, 0.75), 0.07, 0.14, 0.14, verts=10, sm=False),
          cone("TorchFlame", FLAME, (0, 0, 0.98), 0.11, 0.0, 0.34, verts=10)):
    parent(o, tor)

export(props, "props.glb")
for f in ("duck.glb", "props.glb"):
    print("EXPORTED", f, os.path.getsize(os.path.join(OUT, f)))
