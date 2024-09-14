"use client";

import { Header } from "@/components/Header";
import { PopUpModal } from "@/components/PopUpModal";
import Head from "next/head";
import { useState } from "react";

export default function NewFeatures() {
  const [darkMode, toggleDarkMode] = useState(false);
  const [singOutModal, toggleSingOutModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit the form data to your backend here
    console.log("Form Data Submitted:", formData);
  };

  return (
    <>
      <Head>
        <title>New Features Request</title>
        <meta
          name="description"
          content="New Features Request for Instant Calc"
        />
      </Head>
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        toggleModal={toggleSingOutModal}
      ></Header>
      {singOutModal && (
        <PopUpModal toggleModal={toggleSingOutModal} type="signout" />
      )}
      <div
        className={`${
          darkMode ? "dark" : "light"
        } flex flex-col items-center justify-center min-h-screen py-10`}
      >
        <div className="max-w-2xl w-full shadow-md rounded-lg p-6">
          <h1 className="text-3xl font-bold text-purple-600 text-center mb-4">
            Feature Request
          </h1>
          <p className=" text-center mb-8">
            Have a cool feature in mind?
            <br />
            Let us know!
            <br />
            We appreciate your feedback and are always looking for ways to
            improve our platform.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium "
              >
                Feature Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border dark:border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              ></textarea>
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="w-full text-white bg-blue-500 px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
