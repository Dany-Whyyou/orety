import 'package:flutter/material.dart';
import '../core/auth.dart';
import '../core/theme.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  final OretyAuth auth;
  const HomeScreen({super.key, required this.auth});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    widget.auth.addListener(_onAuthChanged);
  }

  @override
  void dispose() {
    widget.auth.removeListener(_onAuthChanged);
    super.dispose();
  }

  void _onAuthChanged() {
    if (!widget.auth.isAuthenticated && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => LoginScreen(auth: widget.auth)),
      );
    }
  }

  Future<void> _logout() async {
    await widget.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.auth.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                gradient: const LinearGradient(
                  colors: [OretyColors.primary, OretyColors.accent],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: const Icon(Icons.school_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            const Text('Orety', style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () {},
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'logout') _logout();
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: const [
                    Icon(Icons.logout, size: 18, color: OretyColors.danger),
                    SizedBox(width: 10),
                    Text('Déconnexion',
                        style: TextStyle(color: OretyColors.danger)),
                  ],
                ),
              ),
            ],
            child: Padding(
              padding: const EdgeInsets.only(right: 12, left: 4),
              child: CircleAvatar(
                radius: 17,
                backgroundColor: OretyColors.primary50,
                child: Text(
                  user?.initials ?? '?',
                  style: const TextStyle(
                    fontSize: 13,
                    color: OretyColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _WelcomeCard(user: user),
            const SizedBox(height: 20),
            const _SectionTitle('Mes enfants'),
            const SizedBox(height: 12),
            const _EmptyChildrenCard(),
            const SizedBox(height: 24),
            const _SectionTitle('Dernières observations'),
            const SizedBox(height: 12),
            const _EmptyObservationsCard(),
            const SizedBox(height: 24),
            const _SectionTitle('Actions rapides'),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _QuickAction(icon: Icons.bar_chart_rounded, label: 'Bulletins', color: OretyColors.primary)),
                const SizedBox(width: 10),
                Expanded(child: _QuickAction(icon: Icons.calendar_today_rounded, label: 'Présences', color: OretyColors.accent)),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: _QuickAction(icon: Icons.forum_outlined, label: 'Messages', color: OretyColors.warning)),
                const SizedBox(width: 10),
                Expanded(child: _QuickAction(icon: Icons.event_note_rounded, label: 'Activités', color: OretyColors.success)),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _WelcomeCard extends StatelessWidget {
  final OretyUser? user;
  const _WelcomeCard({required this.user});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final prenom = user?.prenom?.isNotEmpty == true ? user!.prenom! : (user?.pseudo ?? 'Parent');
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: [
            OretyColors.primary.withValues(alpha: 0.12),
            OretyColors.accent.withValues(alpha: 0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: OretyColors.border.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: OretyColors.border.withValues(alpha: 0.6)),
            ),
            child: const Text(
              '✨  Année 2026-2027',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Bonjour $prenom 👋',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 4),
          Text(
            'Voici les dernières nouvelles de vos enfants — le ${_formatDate(now)}.',
            style: const TextStyle(color: OretyColors.textMuted, fontSize: 13),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime d) {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return '${d.day} ${months[d.month - 1]}';
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: OretyColors.text,
        ),
      );
}

class _EmptyChildrenCard extends StatelessWidget {
  const _EmptyChildrenCard();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.white,
        border: Border.all(color: OretyColors.border),
      ),
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: OretyColors.primary50,
            ),
            child: const Icon(Icons.family_restroom_rounded,
                color: OretyColors.primary, size: 26),
          ),
          const SizedBox(height: 12),
          const Text(
            'Aucun enfant lié à ce compte',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(height: 4),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Contactez l\'école pour associer vos enfants à votre clé parentale.',
              textAlign: TextAlign.center,
              style: TextStyle(color: OretyColors.textMuted, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyObservationsCard extends StatelessWidget {
  const _EmptyObservationsCard();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.white,
        border: Border.all(color: OretyColors.border),
      ),
      child: const Center(
        child: Text(
          'Aucune observation pour le moment.',
          style: TextStyle(color: OretyColors.textMuted, fontSize: 13),
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _QuickAction({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {},
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: OretyColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
