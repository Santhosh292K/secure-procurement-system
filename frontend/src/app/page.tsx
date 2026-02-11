'use client';

import Link from 'next/link';
import { ShoppingCart, FileText, CheckCircle, Users, Building2, TrendingUp, ArrowRight, Zap, Clock, Shield } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                    <div className="text-center animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                            <ShoppingCart className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-primary">Modern Procurement Solution</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                            Streamline Your
                            <span className="block text-primary">Procurement Process</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                            A comprehensive vendor quotation and approval management system designed to simplify procurement workflows, enhance collaboration, and drive efficiency.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/login"
                                className="group px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a
                                href="#about"
                                className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl transition-all"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 bg-card/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">What is This App?</h2>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            Our Secure Procurement System is an end-to-end digital platform that revolutionizes how organizations manage their vendor relationships and procurement processes.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-background rounded-2xl p-8 border border-border hover:border-primary transition-all">
                            <h3 className="text-2xl font-bold text-foreground mb-4">For Organizations</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Empower your procurement team with intelligent tools to manage vendor quotations, streamline approval workflows, and maintain complete visibility over the entire procurement lifecycle. Make data-driven decisions with comprehensive analytics and reporting.
                            </p>
                        </div>
                        <div className="bg-background rounded-2xl p-8 border border-border hover:border-primary transition-all">
                            <h3 className="text-2xl font-bold text-foreground mb-4">For Vendors</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Submit professional quotations with detailed line items, track your submission status in real-time, and build stronger relationships with your clients. Enjoy a seamless, transparent, and efficient bidding process.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">How It Works</h2>
                        <p className="text-lg text-muted-foreground">Simple, efficient, and secure procurement in three steps</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {processSteps.map((step, index) => (
                            <div key={step.title} className="relative">
                                <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary transition-all h-full">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-primary">{index + 1}</span>
                                        </div>
                                        <step.icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                                    <p className="text-muted-foreground">{step.description}</p>
                                </div>
                                {index < processSteps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                        <ArrowRight className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-card/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Powerful Features</h2>
                        <p className="text-lg text-muted-foreground">Everything you need to manage procurement efficiently</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className="bg-background rounded-2xl p-6 border border-border hover:border-primary transition-all duration-300 animate-slide-up hover:shadow-lg"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <feature.icon className="w-12 h-12 mb-4 text-primary" />
                                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Why Choose Us?</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {benefits.map((benefit) => (
                            <div key={benefit.title} className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                                    <benefit.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3">{benefit.title}</h3>
                                <p className="text-muted-foreground">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary/5">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                        Ready to Transform Your Procurement?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-8">
                        Join organizations that trust our platform for their procurement needs.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-10 py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg transition-all duration-300 text-lg"
                    >
                        Get Started Now
                        <ArrowRight className="w-6 h-6" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
                    <p>Built with Next.js, Node.js, SQLite • Secure & Efficient Procurement Management</p>
                    <p className="mt-2">© 2026 Secure Procurement System. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

const processSteps = [
    {
        icon: Building2,
        title: 'Vendor Submission',
        description: 'Vendors submit detailed quotations with line items, pricing, and all necessary documentation through an intuitive interface.'
    },
    {
        icon: FileText,
        title: 'Review & Evaluation',
        description: 'Approvers review submissions, compare options, and evaluate vendors based on pricing, quality, and other criteria.'
    },
    {
        icon: CheckCircle,
        title: 'Approval & Award',
        description: 'Multi-level approval workflow ensures proper authorization. Track status and notify all stakeholders automatically.'
    }
];

const features = [
    {
        icon: Building2,
        title: 'Vendor Management',
        description: 'Maintain comprehensive vendor profiles with contact information, performance history, and relationship tracking.'
    },
    {
        icon: FileText,
        title: 'Quotation Submission',
        description: 'Create detailed quotations with multiple line items, pricing, descriptions, and supporting documents.'
    },
    {
        icon: CheckCircle,
        title: 'Approval Workflow',
        description: 'Configurable multi-level approval process with automated notifications and status tracking.'
    },
    {
        icon: Users,
        title: 'Role-Based Access',
        description: 'Secure access control with distinct roles: Vendors, Approvers, and Administrators with tailored dashboards.'
    },
    {
        icon: TrendingUp,
        title: 'Analytics & Insights',
        description: 'Comprehensive reporting on procurement metrics, vendor performance, and spending patterns.'
    },
    {
        icon: ShoppingCart,
        title: 'End-to-End Tracking',
        description: 'Monitor quotations from submission to approval with complete audit trails and transparency.'
    }
];

const benefits = [
    {
        icon: Zap,
        title: 'Fast & Efficient',
        description: 'Reduce procurement cycle time by up to 60% with streamlined digital workflows and automated processes.'
    },
    {
        icon: Shield,
        title: 'Secure & Reliable',
        description: 'Enterprise-grade security with encrypted data, secure authentication, and comprehensive access controls.'
    },
    {
        icon: Clock,
        title: '24/7 Availability',
        description: 'Access the system anytime, anywhere. Vendors and approvers can work on their own schedule.'
    }
];
