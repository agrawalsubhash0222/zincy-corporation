package com.zincycorporation.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zincycorporation.entity.Users;

public interface UserRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByMobile(String mobile);
}