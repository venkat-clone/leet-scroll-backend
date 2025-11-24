import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class HomeOverview extends StatelessWidget {
  final VoidCallback onStart;

  const HomeOverview({super.key, required this.onStart});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 40),
              Text(
                'Welcome back,',
                style: GoogleFonts.outfit(
                  fontSize: 28,
                  color: Colors.grey[400],
                ),
              ),
              Text(
                'Developer', // TODO: Get actual user name
                style: GoogleFonts.outfit(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 60),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E1E),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.grey[800]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Daily Goal',
                      style: GoogleFonts.firaCode(
                        color: Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Keep your streak alive! Solve a problem today.',
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 24),
                    LinearProgressIndicator(
                      value: 0.0,
                      backgroundColor: Colors.grey[800],
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '0/1 Completed',
                      style: TextStyle(color: Colors.grey[400]),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Center(
                child: Column(
                  children: [
                    Text(
                      'Swipe left to vibe learning',
                      style: GoogleFonts.firaCode(
                        color: Colors.grey[600],
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: onStart,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.green.withOpacity(0.1),
                          border: Border.all(color: Colors.green),
                        ),
                        child: const Icon(
                          Icons.arrow_forward,
                          color: Colors.green,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
