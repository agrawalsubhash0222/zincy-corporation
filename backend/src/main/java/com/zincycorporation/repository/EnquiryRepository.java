package com.zincycorporation.repository;

import com.zincycorporation.entity.Enquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {
    List<Enquiry> findAllByOrderByCreatedAtDesc();
}