# Bicycle Racks — Project Proposal

_Jom AI @ Tampines hackathon. Originally drafted as `Bicycle Racks Proposal.docx`, converted here for diffability and search._

## Case Studies

- **SG dual-tier rack system** — https://www.youtube.com/watch?v=Dok2vaVSilM
- **Netherlands company solution** — https://www.youtube.com/watch?v=HW6DaxEEt2k
- **Suspension system** — https://www.youtube.com/watch?v=IXMhw7xTsMs
- **Japan's underground storage system** — https://youtu.be/pcZSU40RBrg?si=ImuxrxSbuZ_AKvzY
  - _Note: Singapore tried this before at Kampong Admiralty but turned out with low take-up rate._

## Interview Findings

_Summarised from 4 interviewees._

- Bicycle racks are almost always full (>75%)
- Most bicycles on bicycle racks at the moment seem to be abandoned (25–50%)
- Parking illegally mostly due to convenience or when the nearby racks are full also (need something to tell them the next nearest parking rack)
- Not aware of proper parking spots

## Proposed Improvements

- Adding bicycle racks on each floor of HDBs would make parking and accessing bicycles more convenient for residents.
- Removal of abandoned bikes to free up precious rack space, designate more parking slots for popular hotspots.
- Add more racks, include more double-tier racks to put more bicycle.

## Preliminary Proposal

_Not taking into account the interview findings yet._

### Short / Medium Term

- **Redesigned racks** with LED lights to indicate fullness (people can tell from afar; apps can tap on this information to direct users to the subsequent nearest rack).
- **Digital locks** that detect bicycle inactivity (weeks/months) and send them to the municipal via OneService for removal.
- Alternatively, to use racks/locks provided, users have to provide their personal information via **Singpass**; if left too long then send warning letter to them / give them opportunity to recycle / repurpose their bikes.
- Tap on **pre-existing CCTVs** and implement computer vision to detect illegally parked bicycles outside designated areas, and remove the bicycles to a storage facility, charge a fee to collect back or recycle them after weeks of no collection.
- **Public sharing companies** should enforce users to park within painted zones on top of the current geofencing and QR code implementation.
- Explicitly paint or design **"Park Here when Full" zones** for parking when primary area/racks are full; make it obvious, include signifiers for users to immediately understand where to park.

### Long Term

- Government takes control of retired bikes and repurposes them, responsible for the upkeep and maintenance of the bikes.
- Bikes that are abandoned but salvageable will be repaired and maintained by the government, and given out to others to rent — discouraging the need for one to own a bicycle.
- Repair workshops can also be conducted to educate users on how to maintain a bicycle if they eventually choose to own one.
- Bikes that are not salvageable shall be recycled and parts be repurposed.

## Web App Features

- **Activity map** — live occupancy across racks
- **Find nearest next rack** — using data.gov.sg / LTA DataMall for rack locations
- **Geofencing map** — overflow / "Park Here when Full" zones
- **Computer vision**
  - Whether bike is within the area (give an alert)
  - Before-and-after comparison
