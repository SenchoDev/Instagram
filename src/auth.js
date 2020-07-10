import React from "react";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import defaultUserImage from "./images/default-user-image.jpg";
import { useMutation } from "@apollo/react-hooks";
import { CREATE_USER } from "./graphql/mutations";

const provider = new firebase.auth.GoogleAuthProvider();

// Find these options in your Firebase console
firebase.initializeApp({
  apiKey: "AIzaSyDyTDvZ3rkwCinc8mN-sD2liB5eQC5Jcws",
  authDomain: "instagram-senco.firebaseapp.com",
  databaseURL: "https://instagram-senco.firebaseio.com",
  projectId: "instagram-senco",
  storageBucket: "instagram-senco.appspot.com",
  messagingSenderId: "1013670512523",
  appId: "1:1013670512523:web:cc9161ff9e506dcbb9518e",
  measurementId: "G-GVPKNG3ZD1",
});

export const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [authState, setAuthState] = React.useState({ status: "loading" });
  const [createUser] = useMutation(CREATE_USER);

  React.useEffect(() => {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        const idTokenResult = await user.getIdTokenResult();
        const hasuraClaim =
          idTokenResult.claims["https://hasura.io/jwt/claims"];

        if (hasuraClaim) {
          setAuthState({ status: "in", user, token });
        } else {
          // Check if refresh is required.
          const metadataRef = firebase
            .database()
            .ref(`metadata/${user.uid}/refreshTime`);

          metadataRef.on("value", async (data) => {
            if (!data.exists) return;
            // Force refresh to pick up the latest custom claims changes.
            const token = await user.getIdToken(true);
            setAuthState({ status: "in", user, token });
          });
        }
      } else {
        setAuthState({ status: "out" });
      }
    });
  }, []);

  async function logInWithGoogle() {
    const data = await firebase.auth().signInWithPopup(provider);
    if((data.additionalUserInfo.isNewUser)){
      const { uid, displayName, email, photoURL} = data.user;
      const username = `${displayName.replace(/\s+/g, "")}${uid.slice(-5)}`
      const variables = {
        userId: uid,
        name: displayName,
        username,
        email,
        bio: "",
        website: "",
        phoneNumber: "",
        profileImage: photoURL,
      };
      await createUser({ variables });
    }
  }

  async function logInWithEmailAndPassword(email, password){
    const data = await firebase.auth().signInWithEmailAndPassword(email, password);
    return data;
  }

  async function signUpWithEmailAndPassword(formData) {
    const data = await firebase
      .auth()
      .createUserWithEmailAndPassword(formData.email, formData.password);
    if (data.additionalUserInfo.isNewUser) {
      const variables = {
        userId: data.user.uid,
        name: formData.name,
        username: formData.username,
        email: data.user.email,
        bio: "",
        website: "",
        phoneNumber: "",
        profileImage: defaultUserImage,
      };
      await createUser({ variables });
    }
  }

  async function signOut() {
    setAuthState({ status: "loading" });
    await firebase.auth().signOut();
    setAuthState({ status: "out" });
  }

  if (authState.status === "loading") {
    return null;
  } else {
    return (
      <AuthContext.Provider
        value={{
          authState,
          logInWithGoogle,
          signOut,
          signUpWithEmailAndPassword,
          logInWithEmailAndPassword,
          
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
}

export default AuthProvider;
