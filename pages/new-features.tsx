"use client";

import { Header } from "@/components/Header";
import { PopUpModal } from "@/components/PopUpModal";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { database } from "@/lib/firebase-client";
import { push, ref, serverTimestamp } from "firebase/database";
import Head from "next/head";
import { useState } from "react";

interface FeatureRequestForm {
  name: string;
  email: string;
  description: string;
}

const FEATURE_REQUESTS_PATH = "featureRequests";
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_DESCRIPTION_LENGTH = 5000;
const EMPTY_FORM: FeatureRequestForm = { name: "", email: "", description: "" };

export default function NewFeatures() {
  const { darkMode } = useDarkMode();

  const [singOutModal, toggleSingOutModal] = useState(false);
  const [formData, setFormData] = useState<FeatureRequestForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    if (!database) {
      setError("Feature requests are temporarily unavailable. Please try again later.");
      return;
    }

    setSubmitting(true);

    try {
      await push(ref(database, FEATURE_REQUESTS_PATH), {
        name: formData.name.trim(),
        email: formData.email.trim(),
        description: formData.description.trim(),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setFormData(EMPTY_FORM);
    } catch (submitError) {
      console.error("Failed to submit feature request:", submitError);
      setError("We couldn't submit your request. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>New Features Request</title>
        <meta name="description" content="New Features Request for Instant Calc" />
      </Head>
      <Header toggleModal={toggleSingOutModal}></Header>
      {singOutModal && <PopUpModal toggleModal={toggleSingOutModal} type="signout" />}
      <div
        className={`${
          darkMode ? "dark" : "light"
        } flex flex-col items-center justify-center min-h-screen py-10`}
      >
        <div className="max-w-2xl w-full shadow-md rounded-lg p-6">
          <h1 className="text-3xl font-bold text-purple-600 text-center mb-4">Feature Request</h1>
          <p className=" text-center mb-8">
            Have a cool feature in mind?
            <br />
            Let us know!
            <br />
            We review every request and prioritize based on community interest.
          </p>

          {submitted ? (
            <div className="text-center py-16">
              <p className="text-2xl font-semibold text-green-400 mb-2">Thank you!</p>
              <p className="text-gray-400">
                We review every request and keep the community posted.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm text-purple-400 hover:text-purple-300 underline"
              >
                Submit another
              </button>
            </div>
          ) : (
            <>
              {error && (
                <p
                  role="alert"
                  className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                >
                  {error}
                </p>
              )}
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
                    maxLength={MAX_NAME_LENGTH}
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
                    maxLength={MAX_EMAIL_LENGTH}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium ">
                    Feature Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    className="mt-1 block w-full px-3 py-2 border dark:border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  ></textarea>
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full text-white bg-blue-500 px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
