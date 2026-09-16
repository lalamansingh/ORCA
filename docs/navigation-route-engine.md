# Marine Route Engine Specification

## Mathematical Foundation
The ORCA Marine Route Engine calculates navigational corridors using geodesic Great Circle lines augmented with intermediate fairway waypoints.

### Haversine Distance Formulation
Given two coordinates $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$:
$$\Delta\phi = \phi_2 - \phi_1$$
$$\Delta\lambda = \lambda_2 - \lambda_1$$
$$a = \sin^2(\Delta\phi/2) + \cos(\phi_1)\cos(\phi_2)\sin^2(\Delta\lambda/2)$$
$$c = 2 \cdot \operatorname{atan2}(\sqrt{a}, \sqrt{1-a})$$
$$d = R \cdot c$$
where $R = 6371\text{ km}$.
