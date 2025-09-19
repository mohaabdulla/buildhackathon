-- Restaurant placements for tiny 800x600 map
-- Ensuring good distribution across the small area with minimum 80px spacing

DELETE FROM RESTAURANT_PLACEMENTS;

INSERT INTO RESTAURANT_PLACEMENTS (restaurant_id, x, y) VALUES
-- Northwest quadrant
(1, 120, 100),   -- Mario's Italian
(2, 280, 120),   -- Dragon Palace (Chinese)
(3, 150, 220),   -- Taj Mahal (Indian)

-- Northeast quadrant  
(4, 520, 100),   -- El Sombrero (Mexican)
(5, 650, 150),   -- Bangkok Street (Thai)
(6, 580, 250),   -- Liberty Diner (American)

-- Southwest quadrant
(7, 100, 380),   -- Pizza Corner (Italian)
(8, 250, 350),   -- Golden Dragon (Chinese)
(9, 180, 480),   -- Spice Garden (Indian)

-- Southeast quadrant
(10, 520, 370),  -- Fiesta Cantina (Mexican)
(11, 650, 420),  -- Pad Thai Palace (Thai)
(12, 580, 520),  -- Route 66 Grill (American)

-- Central area restaurants for better connectivity
(13, 350, 200),  -- Central Italian
(14, 400, 300),  -- Central Chinese
(15, 450, 400),  -- Central Indian

-- Additional edge restaurants if needed
(16, 50, 250),   -- West Mexican
(17, 720, 280),  -- East Thai
(18, 380, 80),   -- North American
(19, 420, 550),  -- South Italian
(20, 300, 450),  -- Southwest Chinese
(21, 500, 180),  -- Northeast Indian
(22, 150, 350);  -- Central-West Mixed
