import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config.dart';

class OretyUser {
  final String id;
  final String pseudo;
  final String? nom;
  final String? prenom;
  final String? roleCode;
  final String? roleLibelle;
  final String? photoUrl;
  final String? organisationId;

  OretyUser({
    required this.id,
    required this.pseudo,
    this.nom,
    this.prenom,
    this.roleCode,
    this.roleLibelle,
    this.photoUrl,
    this.organisationId,
  });

  String get displayName =>
      [prenom, nom].where((s) => s != null && s.isNotEmpty).join(' ').trim().isEmpty
          ? pseudo
          : '${prenom ?? ''} ${nom ?? ''}'.trim();

  String get initials {
    final n = (nom ?? '').trim();
    final p = (prenom ?? '').trim();
    final a = p.isNotEmpty ? p[0] : '';
    final b = n.isNotEmpty ? n[0] : '';
    final r = (a + b).toUpperCase();
    return r.isEmpty ? '?' : r;
  }

  factory OretyUser.fromJson(Map<String, dynamic> row) {
    final roleRaw = row['roles'];
    final role = roleRaw is List
        ? (roleRaw.isNotEmpty ? roleRaw.first as Map<String, dynamic> : null)
        : roleRaw as Map<String, dynamic>?;
    return OretyUser(
      id: row['id'] as String,
      pseudo: row['pseudo'] as String,
      nom: row['nom'] as String?,
      prenom: row['prenom'] as String?,
      roleCode: role?['code'] as String?,
      roleLibelle: role?['libelle'] as String?,
      photoUrl: row['photo_url'] as String?,
      organisationId: row['organisation_id'] as String?,
    );
  }
}

class OretyAuth extends ChangeNotifier {
  OretyUser? _currentUser;
  bool _loading = false;

  OretyUser? get currentUser => _currentUser;
  bool get loading => _loading;
  bool get isAuthenticated => _currentUser != null;

  SupabaseClient get _sb => Supabase.instance.client;

  OretyAuth() {
    _sb.auth.onAuthStateChange.listen((event) async {
      if (event.event == AuthChangeEvent.signedOut) {
        _currentUser = null;
        notifyListeners();
      } else if (event.event == AuthChangeEvent.signedIn ||
          event.event == AuthChangeEvent.initialSession) {
        await _refreshProfile();
      }
    });
  }

  /// Restore session on app boot.
  Future<void> init() async {
    if (_sb.auth.currentSession != null) {
      await _refreshProfile();
    }
  }

  Future<void> _refreshProfile() async {
    final uid = _sb.auth.currentUser?.id;
    if (uid == null) {
      _currentUser = null;
      notifyListeners();
      return;
    }
    try {
      final data = await _sb
          .from('utilisateurs')
          .select(
              'id, pseudo, nom, prenom, photo_url, organisation_id, roles:role_id(code, libelle)')
          .eq('id', uid)
          .maybeSingle();
      if (data != null) {
        _currentUser = OretyUser.fromJson(data);
      }
    } catch (e) {
      debugPrint('refreshProfile error: $e');
    }
    notifyListeners();
  }

  /// Sign in with pseudo + password. Throws with a localized message on failure.
  Future<void> signInWithPseudo(String pseudo, String password) async {
    _loading = true;
    notifyListeners();
    try {
      await _sb.auth.signInWithPassword(
        email: OretyConfig.pseudoToEmail(pseudo),
        password: password,
      );
      await _refreshProfile();

      // Reject if the logged-in user's role doesn't match the app's expected role
      final code = _currentUser?.roleCode;
      if (code != null &&
          code != OretyConfig.expectedRole &&
          code != 'super_admin' &&
          code != 'admin_org') {
        await signOut();
        throw AuthException(
          'Ce compte n\'est pas autorisé à utiliser cette application.',
        );
      }
    } on AuthException catch (e) {
      throw AuthException(_friendlyError(e.message));
    } catch (e) {
      throw AuthException('Erreur lors de la connexion.');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _sb.auth.signOut();
    _currentUser = null;
    notifyListeners();
  }

  String _friendlyError(String raw) {
    final m = raw.toLowerCase();
    if (m.contains('invalid') || m.contains('credentials')) {
      return 'Pseudo ou mot de passe incorrect.';
    }
    if (m.contains('network') || m.contains('connection')) {
      return 'Problème de connexion réseau.';
    }
    return 'Impossible de se connecter. Réessayez.';
  }
}
