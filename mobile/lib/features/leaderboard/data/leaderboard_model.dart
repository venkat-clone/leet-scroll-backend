class LeaderboardEntry {
  final String id;
  final String? name;
  final int score;
  final int problemsSolved;

  LeaderboardEntry({
    required this.id,
    this.name,
    required this.score,
    required this.problemsSolved,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      id: json['id'],
      name: json['name'],
      score: json['score'],
      problemsSolved: json['problemsSolved'] ?? 0,
    );
  }
}
