package com.snapdose.api.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FirebaseConfig {

    @Bean
    public Firestore firestore() throws Exception {
        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.getApplicationDefault())
                .build();
            FirebaseApp.initializeApp(options);
        }
        return FirestoreClient.getFirestore();
    }
}
