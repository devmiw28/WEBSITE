-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 05, 2025 at 04:14 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `marmudb`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_accounts`
--

CREATE TABLE `tbl_accounts` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `hash_pass` varchar(255) NOT NULL,
  `role` enum('User','Admin','Barber','TattooArtist') DEFAULT 'User'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_accounts`
--

INSERT INTO `tbl_accounts` (`id`, `username`, `email`, `hash_pass`, `role`) VALUES
(1, 'admin', 'admin@admin', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Admin'),
(2, 'johndoe', 'johndoe@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'User'),
(3, 'janesmith', 'janesmith@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'User'),
(4, 'carlosr', 'carlosr@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Barber'),
(5, 'marialopez', 'marialopez@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'TattooArtist'),
(6, 'liamw', 'liamw@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'User'),
(7, 'ace', '33aceleonardo@gmail.com', 'daaad6e5604e8e17bd9f108d91e26afe6281dac8fda0091040a7a6d7bd9b43b5', 'User'),
(8, 'mark', 'leonardomarkace@gmail.com', 'd8c486f3530042ead4c30d4cf60ac77fdf683fd15796096408b183941c335746', 'User'),
(9, 'qwe', 'qweqwe@gmail.com', 'c9fe854ea69fc0a252340e152864b539b116c36cf1ac419652e1826c3071d5ed', 'User'),
(16, 'markace', '132markleonardo@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Barber'),
(17, 'is', 'leonardomarkace.pdm@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'TattooArtist');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_admins`
--

CREATE TABLE `tbl_admins` (
  `id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `fullname` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_admins`
--

INSERT INTO `tbl_admins` (`id`, `account_id`, `fullname`) VALUES
(1, 1, 'Administrator');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_appointment`
--

CREATE TABLE `tbl_appointment` (
  `id` int(11) NOT NULL,
  `fullname` varchar(255) NOT NULL,
  `service` varchar(255) DEFAULT NULL,
  `appointment_date` varchar(10) DEFAULT NULL,
  `time` varchar(10) NOT NULL,
  `remarks` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `artist_id` int(11) DEFAULT NULL,
  `artist_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_appointment`
--

INSERT INTO `tbl_appointment` (`id`, `fullname`, `service`, `appointment_date`, `time`, `remarks`, `user_id`, `status`, `artist_id`, `artist_name`) VALUES
(1, 'John Doe', 'Tattoo', '2025-11-05', '10:00 AM', 'Wants small forearm tattoo', 1, 'Abandoned', 1, 'Carlos Reyes'),
(2, 'Jane Smith', 'Haircut', '2025-11-06', '2:30 PM', 'Double ear piercing', 2, 'Approved', 2, 'Maria Lopez'),
(3, 'Liam Wong', 'Haircut', '2025-11-07', '4:00 PM', 'Simple line art tattoo', 3, 'Completed', 1, 'Carlos Reyes'),
(4, 'John Doe', 'Haircut', '2025-11-10', '1:00 PM', 'Medium size on shoulder', 1, 'Cancelled', 2, 'Maria Lopez'),
(7, 'Ace L.', 'Tattoo', '2025-11-25', '6:00 PM', '', 4, 'Pending', 2, 'Maria Lopez'),
(13, 'qwe', 'Tattoo', '2025-11-07', '16:00', '', 6, 'Denied', 2, 'Maria Lopez'),
(14, 'qwe', 'Haircut', '2025-11-20', '4:00 PM', '', 6, 'Pending', 1, 'Carlos Reyes'),
(19, 'Ace L.', 'Tattoo', '2025-11-05', '1:00 PM', '', 4, 'Cancelled', 2, 'Maria Lopez'),
(20, 'Ace L.', 'Haircut', '2025-11-03', '10:00 AM', '', 4, 'Completed', 1, 'Carlos Reyes');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_clients`
--

CREATE TABLE `tbl_clients` (
  `id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `fullname` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_clients`
--

INSERT INTO `tbl_clients` (`id`, `account_id`, `fullname`) VALUES
(1, 2, 'John Doe'),
(2, 3, 'Jane Smith'),
(3, 6, 'Liam Wong'),
(4, 7, 'Ace L.'),
(5, 8, 'Mark'),
(6, 9, 'qwe'),
(8, 16, 'Mark Ace');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_feedback`
--

CREATE TABLE `tbl_feedback` (
  `id` int(11) NOT NULL,
  `account_id` int(11) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `stars` int(11) DEFAULT NULL CHECK (`stars` between 1 and 5),
  `message` text DEFAULT NULL,
  `reply` text DEFAULT NULL,
  `date_submitted` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_feedback`
--

INSERT INTO `tbl_feedback` (`id`, `account_id`, `username`, `stars`, `message`, `reply`, `date_submitted`, `resolved`) VALUES
(1, 1, 'johndoe', 5, 'Amazing experience, the artist was very professional!', 'Thank you, John! Glad you liked it!', '2025-11-02 11:40:39', 1),
(2, 2, 'janesmith', 4, 'Good service, but the wait time was a bit long.', 'We appreciate your feedback, Jane!', '2025-11-02 11:40:39', 1),
(3, 3, 'liamw', 5, 'Perfect line work, will definitely return!', NULL, '2025-11-02 11:40:39', 0),
(4, 4, 'ace', 3, 'good', 'asd', '2025-11-02 15:11:12', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_staff`
--

CREATE TABLE `tbl_staff` (
  `id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `fullname` varchar(255) NOT NULL,
  `specialization` enum('Barber','TattooArtist') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_staff`
--

INSERT INTO `tbl_staff` (`id`, `account_id`, `fullname`, `specialization`) VALUES
(1, 4, 'Carlos Reyes', 'Barber'),
(2, 5, 'Maria Lopez', 'TattooArtist'),
(4, 3, 'Mark Ace', 'Barber'),
(5, 17, 'mak is', 'TattooArtist');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_staff_unavailability`
--

CREATE TABLE `tbl_staff_unavailability` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `unavailable_date` date NOT NULL,
  `unavailable_time` varchar(10) NOT NULL,
  `is_booked` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_staff_unavailability`
--

INSERT INTO `tbl_staff_unavailability` (`id`, `staff_id`, `unavailable_date`, `unavailable_time`, `is_booked`) VALUES
(1, 1, '2025-11-05', '10:00 AM', 1),
(2, 1, '2025-11-07', '4:00 PM', 1),
(3, 2, '2025-11-06', '2:30 PM', 1),
(4, 2, '2025-11-10', '1:00 PM', 1),
(5, 1, '2025-11-08', '11:00 AM', 0),
(6, 2, '2025-11-09', '3:00 PM', 0),
(7, 2, '2025-11-05', '10:00', 0),
(8, 1, '2025-11-05', '10:00', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_accounts`
--
ALTER TABLE `tbl_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `tbl_admins`
--
ALTER TABLE `tbl_admins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_admins_accountid` (`account_id`);

--
-- Indexes for table `tbl_appointment`
--
ALTER TABLE `tbl_appointment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user` (`user_id`),
  ADD KEY `artist_id` (`artist_id`);

--
-- Indexes for table `tbl_clients`
--
ALTER TABLE `tbl_clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_clients_accounts` (`account_id`);

--
-- Indexes for table `tbl_feedback`
--
ALTER TABLE `tbl_feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`account_id`);

--
-- Indexes for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_staff_account` (`account_id`);

--
-- Indexes for table `tbl_staff_unavailability`
--
ALTER TABLE `tbl_staff_unavailability`
  ADD PRIMARY KEY (`id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_accounts`
--
ALTER TABLE `tbl_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `tbl_admins`
--
ALTER TABLE `tbl_admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_appointment`
--
ALTER TABLE `tbl_appointment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `tbl_clients`
--
ALTER TABLE `tbl_clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tbl_feedback`
--
ALTER TABLE `tbl_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_staff_unavailability`
--
ALTER TABLE `tbl_staff_unavailability`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_admins`
--
ALTER TABLE `tbl_admins`
  ADD CONSTRAINT `fk_admins_account` FOREIGN KEY (`account_id`) REFERENCES `tbl_accounts` (`id`),
  ADD CONSTRAINT `fk_admins_accountid` FOREIGN KEY (`account_id`) REFERENCES `tbl_accounts` (`id`),
  ADD CONSTRAINT `fk_tbl_admins_accountid` FOREIGN KEY (`account_id`) REFERENCES `tbl_accounts` (`id`);

--
-- Constraints for table `tbl_appointment`
--
ALTER TABLE `tbl_appointment`
  ADD CONSTRAINT `fk_appointment_client` FOREIGN KEY (`user_id`) REFERENCES `tbl_clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_appointment_staff` FOREIGN KEY (`artist_id`) REFERENCES `tbl_staff` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`id`),
  ADD CONSTRAINT `tbl_appointment_ibfk_1` FOREIGN KEY (`artist_id`) REFERENCES `tbl_users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_clients`
--
ALTER TABLE `tbl_clients`
  ADD CONSTRAINT `fk_clients_account` FOREIGN KEY (`account_id`) REFERENCES `tbl_accounts` (`id`),
  ADD CONSTRAINT `fk_clients_accounts` FOREIGN KEY (`account_id`) REFERENCES `tbl_accounts` (`id`),
  ADD CONSTRAINT `tbl_clients_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `tbl_accounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_feedback`
--
ALTER TABLE `tbl_feedback`
  ADD CONSTRAINT `fk_feedback_account` FOREIGN KEY (`account_id`) REFERENCES `tbl_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_feedback_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  ADD CONSTRAINT `fk_staff_account` FOREIGN KEY (`account_id`) REFERENCES `tbl_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_staff_accounts` FOREIGN KEY (`account_id`) REFERENCES `tbl_accounts` (`id`),
  ADD CONSTRAINT `tbl_staff_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `tbl_accounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_staff_unavailability`
--
ALTER TABLE `tbl_staff_unavailability`
  ADD CONSTRAINT `fk_staff_user` FOREIGN KEY (`staff_id`) REFERENCES `tbl_users` (`id`),
  ADD CONSTRAINT `fk_unavailability_staff` FOREIGN KEY (`staff_id`) REFERENCES `tbl_staff` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_staff_unavailability_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
