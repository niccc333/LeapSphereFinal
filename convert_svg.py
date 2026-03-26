import re

with open('c:/Users/nicot/Documents/GitHub/LeapSphereFinal/Public/LeapSphereLogo.svg', 'r') as f:
    orig = f.read()

# exact match for removing outer svg tags
inner = re.sub(r'(?s)^<svg[^>]*>\s*(.*?)\s*</svg>\s*', r'\1', orig)

new_svg = """<svg width="48" height="48" viewBox="0 0 1800 1800" fill="none" xmlns="http://www.w3.org/2000/svg">
  <svg x="261" y="331.5" width="1278" height="1137" viewBox="0 0 1278 1137">
    """ + inner + """
  </svg>
</svg>"""

with open('c:/Users/nicot/Documents/GitHub/LeapSphereFinal/Public/LeapSphereLogo_google.svg', 'w') as f:
    f.write(new_svg)
print("Done!")
