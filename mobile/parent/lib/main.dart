import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/auth.dart';
import 'core/config.dart';
import 'core/theme.dart';
import 'screens/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: OretyConfig.supabaseUrl,
    anonKey: OretyConfig.supabaseAnonKey,
  );
  runApp(const OretyParentApp());
}

class OretyParentApp extends StatefulWidget {
  const OretyParentApp({super.key});

  @override
  State<OretyParentApp> createState() => _OretyParentAppState();
}

class _OretyParentAppState extends State<OretyParentApp> {
  late final OretyAuth _auth;

  @override
  void initState() {
    super.initState();
    _auth = OretyAuth();
  }

  @override
  void dispose() {
    _auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Orety Parent',
      debugShowCheckedModeBanner: false,
      theme: buildOretyTheme(),
      home: SplashScreen(auth: _auth),
    );
  }
}
