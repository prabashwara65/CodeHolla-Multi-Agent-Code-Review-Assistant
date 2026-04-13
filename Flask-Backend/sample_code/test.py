def bad_function( x,y ):
    result=x+y
    return result

# Very long line that exceeds 88 characters and should be broken into multiple lines for better readability
password="hardcoded123"

def insecure():
    eval("print('dangerous')")
    return True

def test():
    x = 10
    y = 20
    # z is defined but never used
    z = x + y
    return x