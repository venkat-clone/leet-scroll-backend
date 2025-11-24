class Question {
  final String id;
  final String title;
  final String description;
  final List<String> options;
  final int correctOption;
  final String? explanation;
  final String difficulty;
  final String category;
  final List<String> tags;
  final String? codeSnippet;

  Question({
    required this.id,
    required this.title,
    required this.description,
    required this.options,
    required this.correctOption,
    this.explanation,
    required this.difficulty,
    required this.category,
    required this.tags,
    this.codeSnippet,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      options: List<String>.from(json['options']),
      correctOption: json['correctOption'],
      explanation: json['explanation'],
      difficulty: json['difficulty'],
      category: json['category'],
      tags: List<String>.from(json['tags']),
      codeSnippet: json['codeSnippet'],
    );
  }
}
