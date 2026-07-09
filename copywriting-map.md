# Sporetrust Page Copywriting Map

Source page: `app/page.jsx`

Supporting copy components:
- `app/layout.jsx`
- `components/Brand.jsx`
- `components/HeroAvailabilityForm.jsx`
- `components/BookingForm.jsx`
- `components/ThermalReveal.jsx`

Format: pseudo-code page map. Each block shows where the copy appears and the current text.

---

## SEO / Document Metadata

```txt
page.metadata.title:
  "Sporetrust - Independent Mould & Moisture Diagnostics"

page.metadata.description:
  "If you suspect mould, get a definitive answer. Independent testing, damage assessment and repair cost estimate. Plain-English report in 48 hours."

page.openGraph.title:
  "Sporetrust - If you suspect mould, you're probably right"

page.openGraph.description:
  "Most mould problems are bigger and older than what's visible. We test, locate it, document the damage and price the fix. Plain-English report in 48 hours."

page.viewport.themeColor:
  "#F1F0EE"
```

---

## Header / Navigation

```txt
header.brand.ariaLabel:
  "Sporetrust home"

header.brand.wordmark:
  "Sporetrust"

header.nav.links:
  - "The report"
  - "Pricing"
  - "FAQ"

header.nav.primaryCta:
  "Book inspection"
```

---

## Problem Theatre Container

```txt
page.theatre:
  contains:
    - Header / navigation
    - Hero
    - Mobile thermal proof section
    - Signs of contamination
    - Evidence before argument

note:
  This container carries the timed mould-growth background theatre.
```

---

## Hero

```txt
section.hero.eyebrow:
  "[ Independent Mould Diagnostics and Reporting ]"

section.hero.h1:
  "Catch hidden mould with lab verified testing"

section.hero.lede:
  "Independent inspection, moisture mapping and reporting for tenants, homeowners and property managers. We document the cause, extent and likely repair pathway before anyone starts selling you the fix."

section.hero.availabilityForm.input.placeholder:
  "Your postcode"

section.hero.availabilityForm.input.ariaLabel:
  "Your postcode"

section.hero.availabilityForm.button:
  "Check availability"

section.hero.trustItems:
  - "60-min on-site"
  - "48-hour report"
  - "Fixed price, no callout fees"

section.hero.trustBadge.stars:
  five-star markers

section.hero.trustBadge.quote:
  "Clear findings, photos and next steps made it easy to forward without explaining the whole history again."

section.hero.trustBadge.meta:
  "Fast report handoff"
```

### Hero Thermal Reveal

```txt
section.hero.visual.caption:
  "Thermal capture. Brisbane apartment, 2025. The occupant had been told it was "just condensation" for months. Our diagnostics captures hidden moisture, airborne spores, and early damage before mould is visible to the eye."

section.hero.visual.loop:
  - Bedroom visible -> bedroom thermal
  - Bathroom visible -> bathroom thermal
  - Closet visible -> closet thermal

section.hero.visual.labels:
  - "Visible light"
  - "Thermal capture"
```

---

## Mobile Thermal Proof Section

```txt
section.thermalProof.visibility:
  mobile/tablet stacked proof section

section.thermalProof.h2:
  "This is the same wall."

section.thermalProof.caption:
  "Thermal capture. Brisbane apartment, 2025. The occupant had been told it was "just condensation" for months. Our diagnostics captures hidden moisture, airborne spores, and early damage before mould is visible to the eye."

section.thermalProof.visual.loop:
  - Bedroom visible -> bedroom thermal
  - Bathroom visible -> bathroom thermal
  - Closet visible -> closet thermal
```

---

## Signs Of Contamination

```txt
section.signs.eyebrow:
  "[ signs of contamination ]"

section.signs.h2:
  "50% of QLD homes had mould within 12 months. Does yours?"

section.signs.lede:
  "Visible mould is only one signal. We document moisture patterns, material damage, odour and air movement so hidden contamination has somewhere to show itself."

section.signs.headerImage.alt:
  "Elevated mould count viewed through lab testing"

section.signs.cards.behaviour:
  horizontal side-swipe rail; cards bleed toward viewport edge without expanding page width
```

### Signs Card 01

```txt
card.num:
  "01"

card.tag:
  "Visible"

card.title:
  "Water staining on walls or ceilings"

card.copy:
  "Brown rings, tide marks, swollen paint and shadowing can point to roof leaks, plumbing failures, condensation or historical wetting. The cause changes the response."

card.footer.label:
  "Documents"

card.footer.value:
  "Moisture path"

card.image.alt:
  "Water staining on a ceiling and wall surface"
```

### Signs Card 02

```txt
card.num:
  "02"

card.tag:
  "Weather"

card.title:
  "Wet weather, storms and floods"

card.copy:
  "Heavy rain, stormwater overflow and flood events can push moisture into places that look dry again by inspection day. We check what the weather left behind."

card.footer.label:
  "Documents"

card.footer.value:
  "Event history"

card.image.alt:
  "Wet weather and storm moisture affecting an interior room"
```

### Signs Card 03

```txt
card.num:
  "03"

card.tag:
  "Hidden"

card.title:
  "Musty odour without visible growth"

card.copy:
  "A persistent smell can come from wall cavities, cabinetry, underlay, HVAC or damp contents. We pair odour notes with readings instead of guessing."

card.footer.label:
  "Documents"

card.footer.value:
  "Likely reservoir"

card.image.alt:
  "Room corner representing musty odour and hidden dampness"
```

### Signs Card 04

```txt
card.num:
  "04"

card.tag:
  "Moisture"

card.title:
  "Condensation, humidity and cold surfaces"

card.copy:
  "Wet windows, cold external walls and damp cupboards can create mould without a pipe leak. Dew-point risk is measurable, not a matter of opinion."

card.footer.label:
  "Documents"

card.footer.value:
  "Dew-point risk"

card.image.alt:
  "Condensation and humidity on cold indoor surfaces"
```

### Signs Card 05

```txt
card.num:
  "05"

card.tag:
  "Materials"

card.title:
  "Soft plaster, lifted paint, swollen timber"

card.copy:
  "Material failure tells us how long moisture has been present and whether cleaning is enough. Sometimes the affected material has already lost the argument."

card.footer.label:
  "Documents"

card.footer.value:
  "Damage extent"

card.image.alt:
  "Splitting paint and damaged plaster caused by moisture"
```

### Signs Card 06

```txt
card.num:
  "06"

card.tag:
  "Recurring"

card.title:
  "Mould that returns after cleaning"

card.copy:
  "Regrowth usually means the moisture source is still active or the contaminated material was never properly dealt with. Surface cleaning is not a diagnosis."

card.footer.label:
  "Documents"

card.footer.value:
  "Root cause"

card.image.alt:
  "Returning mould on an interior surface after cleaning"
```

### Signs Card 07

```txt
card.num:
  "07"

card.tag:
  "Airflow"

card.title:
  "Dust, HVAC and indoor-air symptoms"

card.copy:
  "Air movement can carry spores away from the source. We check the room, the system and the surrounding moisture conditions before pointing at the obvious patch."

card.footer.label:
  "Documents"

card.footer.value:
  "Exposure pathway"

card.image.alt:
  "Air conditioning vent as an indoor air movement and mould exposure pathway"
```

---

## Evidence Before Argument

```txt
section.evidence.eyebrow:
  "[ evidence before argument ]"

section.evidence.h2:
  "Unbiased testing and documentation of damage, for everyone involved."

section.evidence.lede:
  "One in two Australians reported mould or dampness at home in the previous year. In Queensland rentals, damp and mould can also become a minimum housing standards issue. A Sporetrust report turns stains, odour, moisture and damage into a record people can act on."

section.evidence.tabs:
  - "Tenants"
  - "Homeowners"
  - "Managers"
```

### Evidence Tab: Tenants

```txt
card.01.num:
  "01 / Hidden"
card.01.title:
  "Not all contamination is visible."
card.01.copy:
  "Odour, damp materials and elevated indoor spores can show a problem before a wall turns black. We look past the surface without turning the home into a demolition site."

card.02.num:
  "02 / Standards"
card.02.title:
  "Mould can become a liveability issue."
card.02.copy:
  "Queensland rental homes must meet minimum housing standards during the tenancy, including damp and mould rules unless the issue is tenant-caused. Evidence matters."

card.03.num:
  "03 / Leverage"
card.03.title:
  "A report changes the conversation."
card.03.copy:
  "Photos can be argued with. Moisture readings, likely cause, affected materials and liveability notes give your request a record people can act on."
```

### Evidence Tab: Homeowners

```txt
card.01.num:
  "01 / Cause"
card.01.title:
  "Find the moisture source first."
card.01.copy:
  "Leak, condensation, ventilation and historical wetting can look similar from the room. The repair path changes once the cause is measured."

card.02.num:
  "02 / Insurance"
card.02.title:
  "Claims need more than photos."
card.02.copy:
  "Insurers need causation, extent and timing. We document what is affected and why, before repair quotes start shaping the facts."

card.03.num:
  "03 / Scope"
card.03.title:
  "Control the cost before works begin."
card.03.copy:
  "An independent report helps you compare remediation, building and cleaning scopes against the actual damage, not the most expensive version of the story."
```

### Evidence Tab: Managers

```txt
card.01.num:
  "01 / Record"
card.01.title:
  "A neutral record for both sides."
card.01.copy:
  "When mould is reported, owners and tenants need the same independent picture: what is present, what caused it and what needs to happen next."

card.02.num:
  "02 / Priority"
card.02.title:
  "Know what is urgent."
card.02.copy:
  "Moisture readings, material damage and room conditions help separate a cleaning issue from a repair issue, and a minor concern from a habitability risk."

card.03.num:
  "03 / Scope"
card.03.title:
  "Brief contractors with evidence."
card.03.copy:
  "A diagnostic report gives remediation and building providers a clearer scope, while keeping the advice independent from the company quoting the fix."
```

---

## How We Diagnose

```txt
section.diagnose.eyebrow:
  "[ how we diagnose ]"

section.diagnose.h2:
  "A complete analysis, every time."

section.diagnose.lede:
  "Every Sporetrust inspection runs the same protocol, so the diagnosis is consistent, defensible and complete."

section.diagnose.trustBadge.quote:
  "It gave both sides the same facts before contractors started quoting the fix."

section.diagnose.trustBadge.meta:
  "Manager handover record"
```

### Diagnostic Method 01

```txt
card.num:
  "M.01"

card.tag:
  "Thermal"

card.title:
  "Thermal mapping"

card.measure:
  "Surface temperature differentials across walls, ceilings, floors, plumbing lines and HVAC penetrations."

card.reveals.label:
  "Reveals"

card.reveals.copy:
  "Hidden moisture, cold bridges and leak paths."

card.image.alt:
  "Thermal imaging comparison used during a mould and moisture inspection"
```

### Diagnostic Method 02

```txt
card.num:
  "M.02"

card.tag:
  "Moisture"

card.title:
  "Moisture metering"

card.measure:
  "Pin and pinless readings at surface and depth across timber, gypsum, masonry, tile substrates and skirting cavities."

card.reveals.label:
  "Reveals"

card.reveals.copy:
  "Active wetting and moisture migration."

card.image.alt:
  "Moisture detector used to check damp building materials"
```

### Diagnostic Method 03

```txt
card.num:
  "M.03"

card.tag:
  "Air sample"

card.title:
  "Air sampling"

card.measure:
  "Continuous hygrometer logging on-site, plus optional indoor and outdoor control air samples to an accredited lab."

card.reveals.label:
  "Reveals"

card.reveals.copy:
  "Humidity load and airborne spore count."

card.image.alt:
  "Air sampling cassette used for mould spore capture"
```

### Diagnostic Method 04

```txt
card.num:
  "M.04"

card.tag:
  "Lab"

card.title:
  "Lab analysis"

card.measure:
  "Independent sample handling and lab analysis where spore count, species profile or claim-ready evidence is needed."

card.reveals.label:
  "Reveals"

card.reveals.copy:
  "Contamination indicators and evidence support."

card.image.alt:
  "Laboratory testing equipment for mould sample analysis"
```

---

## What's In Your Report

```txt
section.report.eyebrow:
  "[ what's in your report ]"

section.report.h2:
  "Official evidence for the people who need to act."
```

### Report Checklist

```txt
item.01.title:
  "Where moisture, damage and mould indicators were found"
item.01.copy:
  "Mapped against rooms and surfaces with photos, readings and thermal images."

item.02.title:
  "The likely cause"
item.02.copy:
  "Leak, condensation, ventilation, roof, waterproofing, slab moisture or building defect."

item.03.title:
  "Liveability and urgency notes"
item.03.copy:
  "Clear language for tenants, owners, managers, insurers and contractors."

item.04.title:
  "Damage extent & affected materials"
item.04.copy:
  "What's wet, contaminated, salvageable, or likely to need removal."

item.05.title:
  "Defensible repair cost range"
item.05.copy:
  "Independent cost bands based on current South-East Queensland trade rates."

item.06.title:
  "Sharable PDF + portal access"
item.06.copy:
  "Ready for landlords, property managers, insurers, builders and remediation providers."
```

### Report Trust Badge

```txt
section.report.trustBadge.quote:
  "The report turned a messy back-and-forth into a document everyone could respond to."

section.report.trustBadge.meta:
  "Tenant repair request"
```

### Report Image

```txt
section.report.image.alt:
  "Sample mould diagnostic report showing visual evidence, thermal evidence, moisture record, air sample record and summary"
```

---

## How It Works

```txt
section.steps.eyebrow:
  "[ how it works ]"

section.steps.h2:
  "Four steps. No upsell."

section.steps.lede:
  "From the moment you book, you'll know what's coming and what it costs."
```

### Step Cards

```txt
step.01.num:
  "Step 01"
step.01.title:
  "Book online."
step.01.copy:
  "Tell us what changed: stains, smell, leaks, symptoms, disputes, claims or prior cleanup."

step.02.num:
  "Step 02"
step.02.title:
  "Technician visits."
step.02.copy:
  "Moisture readings, thermal imaging, photos, odour notes, ventilation checks and optional sampling."

step.03.num:
  "Step 03"
step.03.title:
  "Get your report."
step.03.copy:
  "Cause, extent, evidence, images, recommended next step and repair-cost guidance within 48 hours."

step.04.num:
  "Step 04"
step.04.title:
  "Decide what's next."
step.04.copy:
  "No treatment pitch. Use the report with your landlord, insurer, builder or a contractor you already trust."
```

### Tools Strip

```txt
section.steps.tools.label:
  "In the kit"

section.steps.tools.items:
  - "Thermal camera"
  - "Moisture meter"
  - "Hygrometer"
  - "Air sampler"
```

---

## Who Books A Sporetrust Inspection

```txt
section.personas.eyebrow:
  "[ who books a Sporetrust inspection ]"

section.personas.h2:
  "For anyone who needs an answer, not a sales pitch."
```

### Persona Cards

```txt
persona.01.title:
  "Homeowners"
persona.01.copy:
  "Worried about a stain that won't go away. Post-flood, post-storm or post-renovation. You want a clear answer before throwing money at the wrong trade."

persona.02.title:
  "Tenants"
persona.02.copy:
  "You need documented evidence to send to your property manager: for repairs, rental relief, break-lease applications or tribunal proceedings."

persona.03.title:
  "Landlords & property managers"
persona.03.copy:
  "Independent assessments for disputes, insurance claims, end-of-lease handovers or pre-letting peace of mind. One report you can defend."
```

---

## Fixed Pricing

```txt
section.pricing.eyebrow:
  "[ fixed pricing ]"

section.pricing.h2:
  "No hourly rates. No surprises."
```

### Pricing (single offer)

There is one offer — the Lab-Backed Diagnostic at $995. No cheaper tier; every inspection is lab-backed.

```txt
tier.badge:
  "Most booked"

tier.title:
  "Lab-Backed Diagnostic"

tier.tag:
  "One thorough inspection — everything included"

tier.price:
  "$995"

tier.sub:
  "ONCE-OFF - GST INC"

tier.button:
  "Book your inspection"

tier.bullets:
  - "Whole-of-home thermal, moisture & humidity walkthrough"
  - "Up to 3 areas of concern investigated in depth — severity & likely cause per area"
  - "Damage extent & affected materials, quantified"
  - "Defensible repair cost range per area + total"
  - "Indoor air sample + outdoor control, lab-analysed spore count & species"
  - "Suitable for insurance & tribunal submissions"
  - "48-hour digital report, sharable PDF"
```

### Pricing Trust Badge / Footnote

```txt
section.pricing.trustBadge.quote:
  "We knew what was actually wet, what was likely damaged and where to spend money first."

section.pricing.trustBadge.meta:
  "Homeowner insurance pathway"

section.pricing.footnote:
  "Larger homes, multiple buildings, commercial sites or specialist insurance reports - request a custom quote."

section.pricing.footnote.link:
  "request a custom quote"
```

---

## Independence Note

```txt
section.independence.eyebrow:
  "[ a note on independence ]"

section.independence.quote:
  "We don't sell mould treatments, fogging, encapsulants or repairs. In an uneven remediation market, your first document should come from someone who isn't quoting the cleanup."
```

---

## FAQ

```txt
section.faq.eyebrow:
  "[ common questions ]"

section.faq.h2:
  "Before you book."

section.faq.lede:
  "Still unsure? Send us a quick note in the booking form. We'll come back the same business day."
```

### FAQ Items

```txt
faq.01.question:
  "Are you a remediation company?"
faq.01.answer:
  "No. We inspect, document and report. If remediation or building work is needed, we can point you toward vetted providers with the right speciality, but we do not clip the ticket on the cleanup."

faq.02.question:
  "Why not call a remediation company first?"
faq.02.answer:
  "Some remediation providers are excellent. Others overscope, underscope or sell surface treatments that miss the moisture source. There is no single mould-remediation licence that guarantees the scope is right, so diagnosis should come before the quote."

faq.03.question:
  "How long does the on-site assessment take?"
faq.03.answer:
  "Most homes take 60-90 minutes. Larger homes, multiple buildings or sites with complex history can take longer. We'll let you know in advance once we've reviewed your booking notes."

faq.04.question:
  "When do I get the report?"
faq.04.answer:
  "Your digital report lands in your portal within 48 hours of the on-site visit. The lab analysis appendix — spore count and species — arrives 5-7 days after sampling, depending on lab turnaround."

faq.05.question:
  "What if you don't find anything serious?"
faq.05.answer:
  "That's still a useful answer, and you'll get it documented. A low-risk report with prevention guidance is valuable to have on file, especially as a tenant, owner or buyer."

faq.06.question:
  "How accurate are your repair cost estimates?"
faq.06.answer:
  "Our cost ranges are defensible bands based on current South-East Queensland trade rates, the materials affected and the scope indicated by the diagnosis. They let you budget with confidence and benchmark every quote you receive."

faq.07.question:
  "Can I share the report with my landlord, builder or insurer?"
faq.07.answer:
  "Yes. The report is built for that handoff: landlord, property manager, insurer, builder, remediation provider or tribunal support file."

faq.08.question:
  "Do you service my area?"
faq.08.answer:
  "We currently service Brisbane and South-East Queensland. Use the postcode check at the top of the page. If we don't yet service your area, we'll let you know when we do."
```

---

## Booking Section

```txt
section.booking.eyebrow:
  "[ book a diagnostic ]"

section.booking.h2:
  "Stop guessing. Get a real answer."

section.booking.lede:
  "Send us a few details and we'll come back within the business day with availability, a confirmed quote and a booking link."

section.booking.bullets:
  - "We'll confirm service availability for your postcode"
  - "We'll suggest 2-3 inspection times that suit you"
  - "You'll get a fixed quote, no callout fees, no markup"
  - "You can cancel free up to 24 hours before"
```

### Booking Form

```txt
form.booking.name.label:
  "Your name"
form.booking.name.placeholder:
  "Jane Doe"

form.booking.phone.label:
  "Phone"
form.booking.phone.placeholder:
  "04xx xxx xxx"

form.booking.email.label:
  "Email"
form.booking.email.placeholder:
  "jane@email.com"

form.booking.postcode.label:
  "Postcode"
form.booking.postcode.placeholder:
  "4000"

form.booking.role.label:
  "I'm a..."
form.booking.role.defaultOption:
  "Select one"
form.booking.role.options:
  - "Homeowner"
  - "Tenant / renter"
  - "Landlord"
  - "Property manager"
  - "Buyer (pre-purchase)"
  - "Other"

form.booking.message.label:
  "What are you seeing? (optional)"
form.booking.message.placeholder:
  "e.g. recurring mould on bedroom wall after recent storm, smell in the wardrobe, tenant complaint"

form.booking.submit:
  "Request a booking"

form.booking.helper:
  "Usually back within the business day."
```

---

## Footer / Sticky CTA

```txt
footer.brand:
  "Sporetrust"

footer.links:
  - "The report"
  - "Pricing"
  - "FAQ"
  - "Book"

footer.meta:
  "© 2026 Sporetrust Diagnostics - Brisbane & SEQ - ABN 00 000 000 000"

stickyCta:
  "Book inspection ->"
```
