CREATE DATABASE IF NOT EXISTS `project_chess` /*!40100 DEFAULT CHARACTER SET utf8 */;

CREATE TABLE `project_chess`.`user` (
  `id` VARCHAR(14) NOT NULL,
  `alias` VARCHAR(20) NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `password` BINARY(60) NOT NULL,
  `wins` INT NOT NULL DEFAULT 0,
  `losses` INT NOT NULL DEFAULT 0,
  `draws` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `alias_UNIQUE` (`alias` ASC));

CREATE TABLE `project_chess`.`game` (
  `id` VARCHAR(14) NOT NULL,
  `start_time` TIMESTAMP NOT NULL,
  `end_time` TIMESTAMP NULL,
  `state` ENUM('WIN_B', 'WIN_W', 'DRAW', 'ONGOING') NOT NULL,
  `black_type` ENUM('USER', 'LOCAL', 'AI') NOT NULL,
  `black_name` VARCHAR(20) NULL,
  `black_id` VARCHAR(14) NULL,
  `white_type` ENUM('USER', 'LOCAL', 'AI') NOT NULL,
  `white_name` VARCHAR(20) NULL,
  `white_id` VARCHAR(14) NULL,
  `pgn` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `black_FK_idx` (`black_id` ASC),
  INDEX `white_FK_idx` (`white_id` ASC),
  CONSTRAINT `black_FK`
    FOREIGN KEY (`black_id`)
    REFERENCES `project_chess`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `white_FK`
    FOREIGN KEY (`white_id`)
    REFERENCES `project_chess`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);
    
CREATE TABLE `friendship` (
  `user1` varchar(14) NOT NULL,
  `user2` varchar(14) NOT NULL,
  PRIMARY KEY (`user1`,`user2`),
  KEY `user1_FK_idx` (`user1`),
  KEY `user2_FK_idx` (`user2`),
  CONSTRAINT `user1_FK` FOREIGN KEY (`user1`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `user2_FK` FOREIGN KEY (`user2`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

    


