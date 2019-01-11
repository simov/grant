
var decode = (id_token) => {
  var [header, payload, signature] = id_token.split('.')
  return {
    header: JSON.parse(atob(header)),
    payload: JSON.parse(atob(payload)),
    signature
  }
}

var qs = new URLSearchParams(location.search)

if (qs.get('id_token')) {
  console.log('access_token')
  console.log(qs.get('access_token'))

  console.log('id_token')
  console.log(qs.get('id_token'))

  console.log('id_token_jwt %O', decode(qs.get('id_token')))
}
