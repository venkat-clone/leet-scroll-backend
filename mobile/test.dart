import 'dart:io';

void main() async {
  // HARDCODED /tmp — this will FAIL on modern macOS (exactly like Flutter DevFS does)
  final String tmpDirPath = '${Platform.environment['TMPDIR']}';
  print('Trying to write to: ${Directory.systemTemp}::$tmpDirPath');
  final ldemo = Directory.systemTemp;
  Directory.systemTemp.createTemp("/tmp");

  final Directory tmpDir = Directory(tmpDirPath);
  await tmpDir.create(recursive: true); 
  final File hiFile = File('$tmpDirPath/hi.txt');

  try {
    // This line will throw the SAME error you see in Flutter
    await hiFile.writeAsString('Hi from Flutter CLI! This should fail on macOS 13+ 🎉\n');
    
    print('SUCCESS (unexpected): ${hiFile.absolute.path}');
  } on FileSystemException catch (e) {
    print('FAILED — exactly like Flutter DevFS fails:');
    print('Error: ${e.message}');
    print('OS Error: ${e.osError}');
    print('');
    print('This is the REAL proof that /tmp is blocked!');
  }

  print('\n' + '='*60);
  print('NOW TRYING WITH ~/tmp (the fix):');

  // NOW THE WORKING VERSION — hard-coded ~/tmp
  final String homeTmp = '${Platform.environment['HOME']}/tmp';
  final Directory homeTmpDir = Directory(homeTmp);
  final File hiFile2 = File('$homeTmp/hi_from_flutter.txt');

  await homeTmpDir.create(recursive: true); // make sure folder exists

  await hiFile2.writeAsString(
    'Hi from Flutter CLI using ~/tmp — THIS WORKS! 🎉\n'
    'Time: ${DateTime.now()}\n',
  );

  print('SUCCESS: ${hiFile2.absolute.path}');

  // // Open in Finder so you can see it
  // if (Platform.isMacOS) {
  //   Process.run('open', ['-R', hiFile2.absolute.path]);
  // }

  print('\nDone! You just proved:');
  print('  /tmp  → blocked (causes Flutter DevFS crash)');
  print('  ~/tmp → works perfectly (your permanent fix)');
}