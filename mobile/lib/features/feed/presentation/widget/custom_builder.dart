import 'package:flutter/material.dart' as mtl;
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/atom-one-dark-reasonable.dart';
import 'package:markdown/markdown.dart';

class CustomCodeMarkdownBuilder implements MarkdownElementBuilder {
  @override
  bool isBlockElement() => false;

  @override
  mtl.Widget? visitElementAfter(
    Element element,
    mtl.TextStyle? preferredStyle,
  ) {
    return mtl.Text("visitElementAfter");
  }




  @override
  mtl.Widget? visitElementAfterWithContext(
      mtl.BuildContext context,
      Element element,
      mtl.TextStyle? preferredStyle,
      mtl.TextStyle? parentStyle,
      ) {
    // Extract code content from text nodes
    final code = element.textContent;

    // If empty, return null to use default rendering
    if (code.isEmpty) {
      return null;
    }

    // Get language from element attributes (e.g., "language-dart")
    String language = 'dart';
    if (element.attributes.containsKey('class')) {
      final className = element.attributes['class']!;
      if (className.startsWith('language-')) {
        language = className.substring(9); // Remove "language-" prefix
      }
    }

    // Return syntax highlighted code widget
    return mtl.Column(
      crossAxisAlignment: mtl.CrossAxisAlignment.stretch,
      children: [
        // Language header
        mtl.Container(
          padding: const mtl.EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 8,
          ),
          decoration: mtl.BoxDecoration(
            color:
            mtl.Colors.grey[800],
            borderRadius: const mtl.BorderRadius.only(
              topLeft: mtl.Radius.circular(8),
              topRight: mtl.Radius.circular(8),
            ),
          ),
          child: mtl.Text(
            language.toUpperCase(),
            style: mtl.TextStyle(
              fontSize: 12,
              fontWeight: mtl.FontWeight.bold,
              color: mtl.Colors.grey[600],
            ),
          ),
        ),
        // Syntax highlighted code
        mtl.SingleChildScrollView(
          scrollDirection: mtl.Axis.horizontal,

          child: HighlightView(

            code,
            language: language,
            theme: atomOneDarkReasonableTheme,
            padding: const mtl.EdgeInsets.all(16),
            textStyle: const mtl.TextStyle(
              fontFamily: 'monospace',
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }

  @override
  void visitElementBefore(Element element) {
    // super.visitElementBefore(element);
  }

  @override
  mtl.Widget? visitText(Text text, mtl.TextStyle? preferredStyle) {
    return mtl.Text("visitText");
  }
}
