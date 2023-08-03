# Function to check if the given IP is a Docker-related IP
is_docker_ip() {
    local ip="$1"
    local docker_ips
    docker_ips=$(docker network inspect bridge --format='{{range .Containers}}{{.IPv4Address}}{{println}}{{end}}')

    for docker_ip in $docker_ips; do
        if [[ "$docker_ip" == "$ip" ]]; then
            return 0 # The IP is a Docker IP
        fi
    done

    return 1 # The IP is not a Docker IP
}

# Get the LAN IP address excluding Docker-related IPs
lan_ip=$(ip route get 1 | awk '{print $7}')
if is_docker_ip "$lan_ip"; then
    lan_ip=$(ip route get 8.8.8.8 | awk '{print $7}')
fi

export LAN_IP=$lan_ip
