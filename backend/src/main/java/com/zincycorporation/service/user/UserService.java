package com.zincycorporation.service.user;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.zincycorporation.entity.Users;
import com.zincycorporation.repository.UserRepository;;

@Service
public class UserService {

    @Autowired
    private UserRepository repo;

    public Users saveUser(Users user) {
        return repo.save(user);
    }

    public List<Users> getAllUsers() {
        return repo.findAll();
    }
}