# Vignette vocabulary

Draw the thing the company does. Start with a silhouette recognisable at 720 x 320, then make its construction worth looking at at 4x. A company name and stock border cannot repair an unrelated centre image.

Bank note vignettes have no frame. The sky is ruled with horizontal hairlines that grow apart upward, the ground is ruled more densely and darker toward the viewer, and both fade into the paper along an oval. The subject sits on top with its own paper knockouts. `sky`, `ground`, `hills`, `water`, `moon` and `stars` in `kit/vignettes.mjs` do this; every built-in subject starts with them.

## Shading rules

| Form | Mode | Settings that make it read |
|---|---|---|
| Cylinder, boiler, dome, mast, chimney | `contour` or `ruling` along the axis | `light: 'top-left'`, `form: 0.7 to 0.95`, `edge: 0.3`, `highlight: 0.12 to 0.16` so the lit edge stays paper |
| Flat wall, deck, running board | `parallel` with the plane's own angle | `form: 0.5`, low `edge`; vertical boards use `angle: 90` and `spacing: 3 to 3.4` |
| Window, cavity, furnace mouth, hull port | `cross` with `forced: true`, `tone: 0.85 to 0.95` | Dark and flat on purpose; add a mullion line |
| Skin, cloud, smoke, steam, sky glow | `stipple` | `tone: 0.2 to 0.3`, `spacing: 2.2 to 3.2`, `outline: false` for vapour |
| Cloth, sail, feather | `contour` or `parallel` along the fibre | `edge: 0.35 to 0.4`, `swell: [0.6, 1.35]`, a shaft or seam line on top |
| Water | `water` helper | `ruling` with `wave: 1.6`, then a stipple band for the reflection |
| Wheel | `contour` rim with `edge`, then an inner ring, alternating spoke weights, a contoured hub | See `wheel` inside `locomotive` |

Tone is density, width, crossing families and dropout at once. If a surface reads flat, change `light`, `form` or `edge` before adding more lines. If the whole drawing reads grey, you forgot to leave paper: raise `highlight`.

## Built-in subjects

**Locomotive** (`night-railway`, "A 1920s railroad that only runs at night."): night sky with moon and stars, hills, ruled ground, rails on sleepers, tender with coal, cab with two dark windows and rivet rows, a long ruled boiler lit from the top left, smokebox door, steam dome, sand dome, bell, stack with flare, stippled smoke, headlamp, pilot, two drivers with rods and two pilot wheels, a ground shadow.

**Eagle** (`highland-trust`): each wing is one silhouette with a scalloped trailing edge and a shade field that darkens toward the body; shafts run from the wrist to every primary tip; a crosshatched covert band with scallop rows; a contoured body with chest scallops; a fanned tail; a pale stippled head with a hooked beak; talons on a leafy branch over a crosshatched crag.

**Factory** (`foundry`): three contoured chimneys with brick courses and stippled smoke, a sawtooth roof with dark glazing, a brick wall with real joint lines, arched windows in forced crosshatch, a furnace door whose `shade` callback carves a glow out of the dark, a quay and a reflection on ruled water.

**Ship** (`pelagic`): a ruled hull with sheer, planking seams and ports; three masts with bowed contoured sails, yards and seam lines; shrouds and stays that land on the rail; a bow wave, a wake and a reflection band.

**Portrait** (`vesper`): a ruled oval background darker behind the head; crosshatched jacket with lapel lines; a light stippled collar; stippled skin with a contour band on the shadow side of the face; crosshatched hair with sixteen locks; brows, eyes, nose, mouth, ear; a telescope and a star as attributes.

**Rocket** (`orbital`): dawn sky, pad and flame trench, a lattice tower lit from the left, a contoured rocket with seams, fins, engines, a port and a panel, stippled exhaust with a `shade` callback brightening its core.

**Server** (`archive`): a ruled oval vault, orbit curves, three cabinets with lit tops, dark crosshatched sides and ruled fronts, rows of modules with vent slots and indicator circles, feet, looped cables and a reflection band.

## New subject review

At 1x, is the subject recognisable without reading the title? At 4x, does a mechanical or anatomical detail explain each dark region? Does light come from one direction across the whole drawing? Is there paper inside the forms, not only around them? Does the sky fade before it reaches the edge of the slot? The validator measures tone and swell; it cannot see a malformed eagle. Look at the close-up.
