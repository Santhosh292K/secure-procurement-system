'use client';

import Link from 'next/link';
import { Shield, Lock, Key, Hash, FileCheck, Zap } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
            <div className="max-w-6xl w-full">
                {/* Header */}
                <div className="text-center mb-16 animate-fade-in">
                    <Shield className="w-20 h-20 mx-auto mb-6 text-foreground" />
                    <h1 className="text-6xl font-bold text-foreground mb-4">
                        Secure Procurement System
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Advanced Vendor Quotation & Approval System with Enterprise-Grade Cybersecurity
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="bg-card rounded-2xl p-6 border border-border hover:border-primary transition-all duration-300 animate-slide-up hover:shadow-lg"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <feature.icon className="w-12 h-12 mb-4 text-primary" />
                            <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/login"
                        className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2"
                    >
                        <Shield className="w-5 h-5" />
                        Login to System
                    </Link>
                    <a
                        href="#features"
                        className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl transition-all"
                    >
                        Learn More
                    </a>
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-card rounded-xl p-4 text-center border border-border">
                            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-16 text-center text-muted-foreground text-sm">
                    <p>Built with Next.js, Node.js, SQLite • Featuring Advanced Cryptography</p>
                </div>
            </div>
        </div>
    );
}

const features = [
    {
        icon: Lock,
        title: 'Base64 Encoding',
        description: 'Secure data obfuscation and encoding for quotation line items'
    },
    {
        icon: Key,
        title: 'XOR Encryption',
        description: 'Symmetric encryption for sensitive procurement data'
    },
    {
        icon: Hash,
        title: 'SHA-256 Hashing',
        description: 'Data integrity verification and password security'
    },
    {
        icon: FileCheck,
        title: 'Digital Signatures',
        description: 'RSA signatures for quotation authenticity'
    },
    {
        icon: Shield,
        title: 'Password Security',
        description: 'Strength analysis and cracking simulations'
    },
    {
        icon: Zap,
        title: 'JWT Authentication',
        description: 'Token-based secure access control'
    }
];

const stats = [
    { value: '5+', label: 'Security Features' },
    { value: '3', label: 'User Roles' },
    { value: '100%', label: 'Encrypted Data' },
    { value: '24/7', label: 'Secure Access' }
];
