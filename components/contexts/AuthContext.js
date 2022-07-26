import React, { createContext, useEffect, useState } from "react";

const AuthContext = createContext({
  auth: {},
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  setAuth: () => {},
  login: () => {},
  register: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ status: "SIGNED_OUT", user: null });
  const [isAuthLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const loadUserFromCookies = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`).catch(
          (err) => console.error("error: ", err)
        );

        const json = await res.json();

        if (res.status !== 200) {
          setAuthLoading(false);
          setAuth({
            status: "SIGNED_OUT",
            user: null,
          });
          // //clear cookie if bad token
          // return await logout();
          return;
        }

        if (!json.user) {
          setAuthLoading(false);
          setAuth({
            status: "SIGNED_OUT",
            user: null,
          });
          // //clear cookie if bad token
          // return await logout();
          return;
        }

        const { email: userEmail } = await getEmail();

        const { id, name, user } = json.user;
        setAuth({
          status: "SIGNED_IN",
          user: {
            id,
            name,
            user,
            email: userEmail,
          },
        });
        setAuthLoading(false);

        return;
      } catch (error) {
        console.log(
          "Error in function loadUserFromCookie (authcontext.js): ",
          error
        );
      }
    };
    if (isAuthLoading) {
      loadUserFromCookies();
    }
  }, [isAuthLoading]);

  const getEmail = async () => {
    const email = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email`, {
      method: "GET",
      headers: new Headers({ "content-type": "application/json" }),
    })
      .then((res) => res.json())
      .catch((error) => {
        console.error("Incorrect email or password entered.", error);
      });

    return email;
  };

  const login = async (username, password) => {
    const loginResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      }
    )
      .then((res) => res.json())
      .catch((error) => {
        console.error("Incorrect email or password entered.", error);
      });

    if (loginResponse.token) {
      // set auth to loading to refresh user data
      setAuthLoading(true);
    }

    return loginResponse;
  };
  const register = async (email, password, firstName, lastName) => {
    const registerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({
          email: email || "",
          username: email.split("@")[0] || "",
          password: password || "",
          first_name: firstName,
          last_name: lastName,
        }),
      }
    )
      .then((res) => res.json())
      .catch((error) => {
        console.error("Error in register function in authcontext: ", error);
      });

    if (!registerResponse.user) {
      return registerResponse;
    }

    const { id, name, user } = registerResponse.user;

    setAuth({
      status: "SIGNED_IN",
      user: {
        id: id,
        name: name,
        user: user,
        email: email,
      },
    });
    return registerResponse;
  };
  const logout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`)
      .then((res) => res.json())
      .then(() => {
        // setAuth({ status: "SIGNED_OUT", user: null });
        setAuthLoading(true);
        console.log("logging out!");
      })
      .catch((error) => {
        console.error("Error in logout function in authcontext: ", error);
      });
    return;
  };

  // set an extra user variable for convenience (for now)
  const user = auth.user;

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        login,
        getEmail,
        register,
        logout,
        isAuthLoading,
        setAuthLoading,
        user,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => React.useContext(AuthContext);
export const AuthConsumer = AuthContext.Consumer;
