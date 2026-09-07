# Ocean products

ORCA Step 10 provides SST and chlorophyll-a product contracts, metadata, point sampling, map overlays, provenance, and no-data behaviour. It does not calculate a fishing/productivity score or modify official PFZ geometry.

## Source status

INCOIS ERDDAP is a public structured service with griddap/WMS interfaces. Its publicly indexed Daily-OI SST dataset currently ends in 2011; its IRS P4 OCM chlorophyll dataset ends in 2006. They are therefore documented as stale source interfaces and are not shown as current observations. MOSDAC Oceansat-3 documentation was also investigated; no unauthenticated stable point/grid endpoint was integrated.

For development, ORCA uses a small bounded `ORCA Demo Ocean Grid` around Chennai. Every value, map overlay, metadata item, and card is labelled DEMO. SST is °C; chlorophyll-a is mg/m³. Sampling reports a nearest demonstration grid cell and returns `NO_DATA`, never zero, outside its extent and at a deliberate test cell.

The normal API deliberately returns metadata and point samples, not full rasters. Demo map contours are lightweight GeoJSON; a production source should use its official WMS/ERDDAP map endpoint or a tightly scoped backend tile service, never an arbitrary URL proxy. Metadata and samples are cached for 15 minutes.

Chlorophyll-a is an indicator of phytoplankton biomass/ocean productivity, not a fish-availability prediction. Satellite SST and forecast SST are separate products with different times and methods.

Sources: [INCOIS ERDDAP griddap](https://erddap.incois.gov.in/erddap/griddap/documentation.html), [INCOIS chlorophyll metadata](https://erddap.incois.gov.in/erddap/info/IRS_chlorophyll_datasets/index.html), [INCOIS SST metadata](https://erddap.incois.gov.in/erddap/info/NOAA_AVHRR_AMSR_datasets/index.html), [MOSDAC Oceansat-3 references](https://www.mosdac.gov.in/oceansat-3-references).
