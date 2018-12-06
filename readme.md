CREATE TABLE `player` (
  `name` varchar(20) DEFAULT NULL,
  `fname` varchar(20) DEFAULT NULL,
  `surname` varchar(20) DEFAULT NULL,
  `max_correct` int(11) DEFAULT NULL,
  `max_incorrect` int(11) DEFAULT NULL,
  `max_finger` int(11) DEFAULT NULL,
  `last_played` datetime DEFAULT NULL,
  UNIQUE KEY `name` (`name`)
)