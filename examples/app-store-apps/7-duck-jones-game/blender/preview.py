import bpy, sys, math, os
from mathutils import Vector
args = sys.argv[sys.argv.index("--")+1:]
glb, out = args[0], args[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (float(args[2]) if len(args)>2 else -1.6, -3.2, 1.4); 
d = Vector((0,0,0.8)) - cam.location; cam.rotation_euler = d.to_track_quat('-Z','Y').to_euler()
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_object_outline = True
sc.render.resolution_x = 600; sc.render.resolution_y = 600
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
