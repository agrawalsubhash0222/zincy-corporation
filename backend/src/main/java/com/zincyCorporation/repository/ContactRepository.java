package com.zincyCorporation.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zincyCorporation.entity.ContactEnquiry;

public interface ContactRepository extends JpaRepository<ContactEnquiry, Long> {
}