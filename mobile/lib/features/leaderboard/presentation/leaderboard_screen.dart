import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../data/leaderboard_service.dart';
import '../data/leaderboard_model.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  final LeaderboardService _leaderboardService = LeaderboardService();
  List<LeaderboardEntry> _entries = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadLeaderboard();
  }

  Future<void> _loadLeaderboard() async {
    try {
      final entries = await _leaderboardService.getLeaderboard();
      setState(() {
        _entries = entries;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1E1E1E),
      appBar: AppBar(
        title: Text(
          '<Leaderboard />',
          style: GoogleFonts.firaCode(color: Colors.green, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF1E1E1E),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Error: $_error', style: const TextStyle(color: Colors.red)),
                      ElevatedButton(
                        onPressed: _loadLeaderboard,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  itemCount: _entries.length,
                  separatorBuilder: (context, index) => Divider(color: Colors.grey[800]),
                  itemBuilder: (context, index) {
                    final entry = _entries[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _getRankColor(index),
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(
                            color: _getRankTextColor(index),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      title: Text(
                        entry.name ?? 'Anonymous',
                        style: GoogleFonts.firaCode(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(
                        'Solved: ${entry.problemsSolved}',
                        style: GoogleFonts.firaCode(color: Colors.grey),
                      ),
                      trailing: Text(
                        '${entry.score} pts',
                        style: GoogleFonts.firaCode(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Color _getRankColor(int index) {
    switch (index) {
      case 0:
        return Colors.yellow.withOpacity(0.2);
      case 1:
        return Colors.grey.withOpacity(0.2);
      case 2:
        return Colors.orange.withOpacity(0.2);
      default:
        return Colors.grey[800]!;
    }
  }

  Color _getRankTextColor(int index) {
    switch (index) {
      case 0:
        return Colors.yellow;
      case 1:
        return Colors.grey;
      case 2:
        return Colors.orange;
      default:
        return Colors.white;
    }
  }
}
