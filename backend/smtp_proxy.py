import socket
import select
import threading

def proxy(src, dst):
    while True:
        try:
            data = src.recv(4096)
            if not data: break
            dst.sendall(data)
        except:
            break
    try:
        src.close()
    except:
        pass
    try:
        dst.close()
    except:
        pass

def handle_client(client_socket):
    try:
        remote = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        remote.settimeout(10)
        # Using the IPv4 address as requested
        remote.connect(('173.194.193.108', 465))
        
        t1 = threading.Thread(target=proxy, args=(client_socket, remote))
        t2 = threading.Thread(target=proxy, args=(remote, client_socket))
        t1.start()
        t2.start()
    except Exception as e:
        print(f"Error handling proxy: {e}")
        client_socket.close()

if __name__ == "__main__":
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(('0.0.0.0', 2525))
    server.listen(5)
    print("SMTP forwarder bound to 0.0.0.0:2525. Ready for n8n!")
    while True:
        client, addr = server.accept()
        threading.Thread(target=handle_client, args=(client,)).start()
