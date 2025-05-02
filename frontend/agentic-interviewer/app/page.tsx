"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Card,
  CardHeader,
  CardBody,
  Select,
  SelectItem,
} from "@heroui/react";
import { Menu, X, Zap, BarChart, Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [minutes, setMinutes] = useState(30);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleStart = () => {
    router.push(`/interview?timer=${minutes * 60}`);
  };

  const navLinks = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navbar */}
      <Navbar className="bg-black/80 backdrop-blur-md border-b border-white/10 px-4 fixed w-full z-50">
        <NavbarBrand>
          <Link href="/" className="focus:outline-none">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Candid</span>
          </Link>
        </NavbarBrand>

        {/* Desktop Links */}
        <NavbarContent justify="end" className="hidden md:flex gap-4">
          {navLinks.map((link) => (
            <NavbarItem key={link.href}>
              <Button
                as="a"
                href={link.href}
                variant="light"
                className="text-white hover:bg-white/10 transition-all duration-300"
              >
                {link.label}
              </Button>
            </NavbarItem>
          ))}
          <NavbarItem>
            <Button
              onClick={handleStart}
              variant="solid"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
            >
              Start Interview
            </Button>
          </NavbarItem>
        </NavbarContent>

        {/* Mobile Hamburger */}
        <NavbarContent className="md:hidden">
          <NavbarItem>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 focus:outline-none hover:bg-white/10 rounded-lg transition-all duration-300"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-black/90 backdrop-blur-md border-b border-white/10 fixed w-full top-16 z-40"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-4 py-3 hover:bg-white/10 transition-all duration-300"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={handleStart}
            className="block w-full text-left px-4 py-3 hover:bg-white/10 transition-all duration-300"
          >
            Start Interview
          </button>
        </motion.div>
      )}

      {/* Hero */}
      <main className="flex-grow flex items-center justify-center px-4 py-24 bg-gradient-to-br from-blue-900 via-purple-900 to-black pt-40">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Headline & Description */}
          <div className="text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6"
            >
              AI Mock Interview
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-2xl text-white/70 max-w-xl mb-10"
            >
              Practice your technical interview skills with an AI interviewer. Get instant feedback and improve your performance.
            </motion.p>
          </div>

          {/* Right: Controls Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock size={28} className="text-white/80" />
                <span className="text-lg font-medium">Duration:</span>
                <Select
                  aria-label="Interview Duration"
                  selectedKeys={new Set([String(minutes)])}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    setMinutes(Number(val));
                  }}
                  className="bg-black/30 text-white w-32"
                >
                  {[5, 15, 30, 45, 60, 90, 120].map((m) => (
                    <SelectItem key={m} textValue={`${m} minutes`}>
                      {m} minutes
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <Button
                onClick={handleStart}
                size="lg"
                variant="solid"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg transform hover:scale-105 transition-all duration-300 px-10 py-6 text-lg w-full"
              >
                Start Practice Interview
                <ChevronRight className="ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features */}
      <section className="w-full max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-4 py-16">
        {[
          { icon: Zap, title: "Real-time Feedback", desc: "Instant guidance on every step." },
          { icon: BarChart, title: "Comprehensive Analysis", desc: "Deep dive into your problem-solving." },
          { icon: Clock, title: "Practice Anytime", desc: "Use it whenever you have time." },
        ].map(({ icon: Icon, title, desc }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="bg-black/70 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl flex flex-col items-center text-center hover:border-blue-500/50 transition-all duration-300"
          >
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
              <Icon size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-white/70">{desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="bg-black/80 backdrop-blur-md border-t border-white/10 py-6 text-center text-white/60">
        © {new Date().getFullYear()} Candid. All rights reserved.
      </footer>
    </div>
  );
}
