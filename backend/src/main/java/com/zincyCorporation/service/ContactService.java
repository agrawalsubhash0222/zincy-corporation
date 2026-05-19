package com.zincyCorporation.service;

import org.springframework.stereotype.Service;

import com.zincyCorporation.dto.ContactRequest;
import com.zincyCorporation.entity.ContactEnquiry;
import com.zincyCorporation.repository.ContactRepository;

@Service
public class ContactService {

    private final ContactRepository contactRepository;

    public ContactService(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    public ContactEnquiry saveContact(ContactRequest request) {
        ContactEnquiry enquiry = new ContactEnquiry();

        enquiry.setFullName(request.getFullName());
        enquiry.setMobileNumber(request.getMobileNumber());
        enquiry.setEmail(request.getEmail());
        enquiry.setMessage(request.getMessage());

        String lookingFor = request.getLookingFor() == null
                ? ""
                : String.join(", ", request.getLookingFor());

        enquiry.setLookingFor(lookingFor);

        return contactRepository.save(enquiry);
    }
}