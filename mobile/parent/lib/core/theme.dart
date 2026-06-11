import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Orety brand palette — green dominant, blue accent, warm yellows.
class OretyColors {
  static const primary = Color(0xFF1F7A3A); // Vert Orety profond
  static const primary50 = Color(0xFFEEF8F1);
  static const primary100 = Color(0xFFD2EBD8);
  static const primary500 = Color(0xFF28A050);

  static const accent = Color(0xFF2563EB); // Bleu
  static const warning = Color(0xFFF59E0B); // Jaune
  static const danger = Color(0xFFEF4444);
  static const success = Color(0xFF10B981);

  static const text = Color(0xFF0F172A);
  static const textMuted = Color(0xFF64748B);
  static const bg = Color(0xFFFAFAFA);
  static const card = Colors.white;
  static const border = Color(0xFFE2E8F0);
}

ThemeData buildOretyTheme({Brightness brightness = Brightness.light}) {
  final base = brightness == Brightness.dark ? ThemeData.dark() : ThemeData.light();
  final textTheme = GoogleFonts.interTextTheme(base.textTheme);
  final displayTheme = GoogleFonts.plusJakartaSans(
    textStyle: const TextStyle(fontWeight: FontWeight.w700),
  );

  return base.copyWith(
    scaffoldBackgroundColor: OretyColors.bg,
    colorScheme: ColorScheme.fromSeed(
      seedColor: OretyColors.primary,
      brightness: brightness,
      primary: OretyColors.primary,
      secondary: OretyColors.accent,
      error: OretyColors.danger,
      surface: OretyColors.card,
    ),
    textTheme: textTheme.copyWith(
      headlineLarge: displayTheme.copyWith(fontSize: 32, color: OretyColors.text),
      headlineMedium: displayTheme.copyWith(fontSize: 26, color: OretyColors.text),
      headlineSmall: displayTheme.copyWith(fontSize: 22, color: OretyColors.text),
      titleLarge: displayTheme.copyWith(fontSize: 18, color: OretyColors.text),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.6),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: OretyColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: OretyColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: OretyColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: OretyColors.danger),
      ),
      labelStyle: const TextStyle(color: OretyColors.textMuted),
      hintStyle: const TextStyle(color: Color(0xFFA3A3A3)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: OretyColors.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        elevation: 0,
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: OretyColors.bg,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      iconTheme: IconThemeData(color: OretyColors.text),
    ),
    cardTheme: CardThemeData(
      color: OretyColors.card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: OretyColors.border),
      ),
    ),
  );
}
