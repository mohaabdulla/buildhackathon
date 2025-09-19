-- Full map distribution for larger 2400x1800 map
-- Strategic placement across all areas with maximum spacing
INSERT OR REPLACE INTO RESTAURANT_PLACEMENTS (restaurant_id, x, y, district) VALUES
-- Far North edge
(1, 200, 150, 'North'),
(2, 800, 120, 'North'),
(3, 1400, 160, 'North'),
(4, 2000, 140, 'North'),

-- Far West edge  
(5, 150, 500, 'West'),
(6, 180, 900, 'West'),
(7, 160, 1300, 'West'),

-- Far East edge
(8, 2200, 400, 'East'),
(9, 2150, 800, 'East'),
(10, 2250, 1200, 'East'),

-- Far South edge
(11, 300, 1650, 'South'),
(12, 900, 1700, 'South'),
(13, 1500, 1680, 'South'),
(14, 2100, 1650, 'South'),

-- Middle areas - spread across interior
(15, 600, 600, 'Central-West'),
(16, 1200, 450, 'Central-North'),
(17, 1800, 700, 'Central-East'),
(18, 800, 1200, 'Central-South'),
(19, 1600, 1000, 'Central'),

-- Corner areas
(20, 400, 300, 'Northwest'),
(21, 1900, 350, 'Northeast'),
(22, 500, 1500, 'Southwest');
