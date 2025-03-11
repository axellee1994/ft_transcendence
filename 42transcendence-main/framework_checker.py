import os
import json
import re
from typing import List, Dict

class FrameworkChecker:
    def __init__(self):
        self.allowed_technologies = {
            'fastify',
            'node',
            'typescript',
            'tailwindcss',
            'sqlite3'
        }
        
        self.framework_keywords = {
            'react', 'vue', 'angular', 'next', 'nuxt', 'svelte',
            'express', 'koa', 'nest', 'hapi', 'meteor',
            'bootstrap', 'mui', 'chakra-ui', 'styled-components'
        }

    def check_package_json(self, filepath: str) -> List[str]:
        """Check a package.json file for unauthorized dependencies"""
        violations = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                # Remove JavaScript-style comments
                content = re.sub(r'//.*?\n|/\*.*?\*/', '', content, flags=re.DOTALL)
                package_data = json.loads(content)
            
            # Check both types of dependencies
            for dep_type in ['dependencies', 'devDependencies']:
                if dep_type in package_data:
                    for dep in package_data[dep_type]:
                        dep_lower = dep.lower()
                        if any(keyword in dep_lower for keyword in self.framework_keywords) and \
                           not any(allowed in dep_lower for allowed in self.allowed_technologies):
                            violations.append(f"Unauthorized framework in {filepath}: {dep}")
        except json.JSONDecodeError as e:
            print(f"Warning: Error parsing {filepath}: Invalid JSON format - {str(e)}")
        except Exception as e:
            print(f"Warning: Error reading {filepath}: {str(e)}")
            
        return violations

    def check_typescript_file(self, filepath: str) -> List[str]:
        """Check TypeScript file for unauthorized imports"""
        violations = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            import_pattern = r'import.*from [\'"](.+?)[\'"]'
            matches = re.finditer(import_pattern, content)
            
            for match in matches:
                import_path = match.group(1)
                base_package = import_path.split('/')[0].lower()
                if base_package in self.framework_keywords and base_package not in self.allowed_technologies:
                    violations.append(f"Unauthorized import in {filepath}: {import_path}")
                    
        except Exception as e:
            print(f"Warning: Error reading {filepath}: {str(e)}")
            
        return violations

    def find_all_files(self, directory: str) -> Dict[str, List[str]]:
        """Find all package.json and TypeScript files recursively"""
        package_files = []
        typescript_files = []
        
        for root, _, files in os.walk(directory):
            # Skip node_modules directories
            if 'node_modules' in root:
                continue
                
            for file in files:
                full_path = os.path.join(root, file)
                if file == 'package.json':
                    package_files.append(full_path)
                elif file.endswith('.ts'):
                    typescript_files.append(full_path)
        
        return {
            'package_files': package_files,
            'typescript_files': typescript_files
        }

    def scan_project(self) -> Dict[str, List[str]]:
        """Scan project for framework violations"""
        print("Scanning directory for files...")
        all_files = self.find_all_files('.')
        
        results = {
            'package_json_violations': [],
            'typescript_violations': []
        }
        
        # Process package.json files
        print(f"Found {len(all_files['package_files'])} package.json files")
        for filepath in all_files['package_files']:
            violations = self.check_package_json(filepath)
            results['package_json_violations'].extend(violations)
        
        # Process TypeScript files
        print(f"Found {len(all_files['typescript_files'])} TypeScript files")
        for filepath in all_files['typescript_files']:
            violations = self.check_typescript_file(filepath)
            results['typescript_violations'].extend(violations)
        
        return results

def main():
    print("=== Framework Compliance Checker ===")
    checker = FrameworkChecker()
    results = checker.scan_project()
    
    print("\n=== Framework Compliance Report ===")
    
    if results['package_json_violations']:
        print("\nPackage.json violations:")
        for violation in results['package_json_violations']:
            print(f"❌ {violation}")
    else:
        print("\n✅ No package.json violations found")
        
    if results['typescript_violations']:
        print("\nTypeScript import violations:")
        for violation in results['typescript_violations']:
            print(f"❌ {violation}")
    else:
        print("\n✅ No TypeScript import violations found")
        
    total = len(results['package_json_violations']) + len(results['typescript_violations'])
    print(f"\nTotal violations found: {total}")

if __name__ == "__main__":
    main()