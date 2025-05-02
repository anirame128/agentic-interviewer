"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Card,
  CardHeader,
  CardBody,
} from "@heroui/react";
import { Menu, X } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleStart = () => {
    router.push(`/interview?timer=${30 * 60}`); // Default 30 min
  };

  const navLinks = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
  ];

  const tiers = [
    {
      name: "Free",
      price: "$0",
      features: [
        "5 mock interviews per month",
        "Email support",
        "Community access",
      ],
      highlight: false,
    },
    {
      name: "Pro",
      price: "$20/month",
      features: [
        "Unlimited mock interviews",
        "Priority support",
        "Interview analytics",
        "Advanced feedback",
      ],
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navbar */}
      <Navbar className="bg-black/80 backdrop-blur-md border-b border-white/10 px-4 fixed w-full z-50">
        <NavbarBrand>
          <Link className="focus:outline-none" href="/">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Candid
            </span>
          </Link>
        </NavbarBrand>
        {/* Desktop Links */}
        <NavbarContent className="hidden md:flex gap-4" justify="end">
          {navLinks.map((link) => (
            <NavbarItem key={link.href}>
              <Button
                as="a"
                className="text-white hover:bg-white/10 transition-all duration-300"
                href={link.href}
                variant="light"
              >
                {link.label}
              </Button>
            </NavbarItem>
          ))}
          <NavbarItem>
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
              variant="solid"
              onClick={handleStart}
            >
              Start Interview
            </Button>
          </NavbarItem>
        </NavbarContent>
        {/* Mobile Hamburger */}
        <NavbarContent className="md:hidden">
          <NavbarItem>
            <button
              className="p-2 focus:outline-none hover:bg-white/10 rounded-lg transition-all duration-300"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-black/90 backdrop-blur-md border-b border-white/10 fixed w-full top-16 z-40"
          exit={{ opacity: 0, y: -20 }}
          initial={{ opacity: 0, y: -20 }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              className="block px-4 py-3 hover:bg-white/10 transition-all duration-300"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
          <button
            className="block w-full text-left px-4 py-3 hover:bg-white/10 transition-all duration-300"
            onClick={handleStart}
          >
            Start Interview
          </button>
        </motion.div>
      )}
      <div className="flex-1 pt-12 min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Pricing Plans
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Choose the plan that fits your needs and start improving your
              interview skills today.
            </p>
          </motion.div>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 justify-center">
            {tiers.map((tier, idx) => (
              <motion.div
                key={tier.name}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full justify-center ${tier.highlight ? "" : ""} relative`}
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: idx * 0.2 }}
                whileHover={{
                  y: -8,
                  scale: 1.04,
                  boxShadow: "0 8px 32px 0 rgba(80,80,255,0.15)",
                }}
              >
                <Card
                  className={`relative flex flex-col justify-between h-full w-full max-w-md bg-black/70 ${tier.highlight ? "bg-gradient-to-br from-blue-900/80 via-purple-900/80 to-black/80 border-2 border-blue-500/70 shadow-blue-500/20 scale-105 z-10 ring-2 ring-blue-400" : "hover:border-blue-500/50"} shadow-2xl transition-all duration-300 p-0 overflow-visible rounded-3xl`}
                >
                  {/* Most Popular Badge INSIDE Card */}
                  {tier.highlight && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg z-20">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="flex flex-col items-center justify-center space-y-2 pt-12 pb-8 border-b border-white/10 relative">
                    <div className="flex flex-col items-center w-full gap-2">
                      <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wide mb-1">
                        {tier.name}
                      </h2>
                      <div className="flex items-end justify-center gap-2 w-full">
                        <span className="text-2xl md:text-3xl font-bold text-white align-super mb-1">
                          $
                        </span>
                        <span className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
                          {tier.price.replace(/\$|\/.*$/g, "")}
                        </span>
                        {tier.price.includes("/") && (
                          <span className="text-base text-white/60 font-medium mb-2 ml-1">
                            /month
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {/* Divider */}
                  <div className="w-4/5 mx-auto border-t border-white/10 my-4" />
                  <CardBody className="flex flex-col flex-1 items-center space-y-7 py-4 px-8">
                    <ul className="space-y-4 w-full">
                      {tier.features.map((f) => (
                        <li
                          key={f}
                          className="text-white/90 flex items-center text-lg font-medium"
                        >
                          <span className="mr-3 text-green-400 text-2xl">
                            ✓
                          </span>{" "}
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex-1" />
                    <Button
                      className={`mt-8 w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg transform hover:scale-105 transition-all duration-300 py-5 text-xl font-bold rounded-2xl ${tier.highlight ? "ring-2 ring-blue-400" : ""}`}
                      variant="solid"
                    >
                      {tier.name === "Free" ? "Get Started" : "Upgrade Now"}
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <footer className="bg-black/80 backdrop-blur-md border-t border-white/10 py-6 text-center text-white/60">
        © {new Date().getFullYear()} Candid. All rights reserved.
      </footer>
    </div>
  );
}
