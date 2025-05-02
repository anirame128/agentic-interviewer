"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion } from 'framer-motion';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Card,
  CardHeader,
  CardBody,
} from '@heroui/react';
import { Menu, X, Zap, BarChart, Clock, ArrowRight, ChevronRight } from 'lucide-react';

export default function FeaturesPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleStart = () => {
    router.push(`/interview?timer=${30 * 60}`); // Default 30 min for features page
  };

  const navLinks = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Instant Feedback',
      desc: 'AI-powered insights the moment you finish your interview.',
      benefits: [
        'Real-time analysis of your responses',
        'Immediate suggestions for improvement',
        'Technical accuracy assessment'
      ]
    },
    {
      icon: BarChart,
      title: 'Deep Analytics',
      desc: 'Detailed breakdown of your strengths and improvement areas.',
      benefits: [
        'Performance metrics tracking',
        'Progress visualization',
        'Skill gap identification'
      ]
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      desc: 'Practice on-demand, whenever you have time.',
      benefits: [
        '24/7 availability',
        'Customizable session lengths',
        'Progress at your own pace'
      ]
    },
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

      <div className="flex-1 pt-32 min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Features
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Experience the future of interview preparation with our comprehensive suite of AI-powered features
            </p>
          </motion.div>

          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="h-full bg-black/70 backdrop-blur-md border border-white/20 shadow-2xl hover:border-blue-500/50 transition-all duration-300">
                  <CardHeader className="flex flex-col items-center space-y-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                      <feature.icon size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-center">{feature.title}</h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <p className="text-white/70 text-center">{feature.desc}</p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center text-white/80">
                          <ArrowRight className="w-4 h-4 mr-2 text-blue-400" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-white/70 mb-8">
              Join thousands of developers who have improved their interview skills with our platform
            </p>
            <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 shadow-lg transform hover:scale-105 transition-all duration-300">
              Start Your Journey
            </button>
          </motion.div>
        </div>
      </div>
      <footer className="bg-black/80 backdrop-blur-md border-t border-white/10 py-6 text-center text-white/60">
        © {new Date().getFullYear()} Candid. All rights reserved.
      </footer>
    </div>
  );
}
