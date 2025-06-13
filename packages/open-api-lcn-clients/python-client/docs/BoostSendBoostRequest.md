# BoostSendBoostRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**credential** | [**BoostSendBoostRequestCredential**](BoostSendBoostRequestCredential.md) |  | 
**options** | [**BoostSendBoostRequestOptions**](BoostSendBoostRequestOptions.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_boost_request import BoostSendBoostRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendBoostRequest from a JSON string
boost_send_boost_request_instance = BoostSendBoostRequest.from_json(json)
# print the JSON string representation of the object
print(BoostSendBoostRequest.to_json())

# convert the object into a dict
boost_send_boost_request_dict = boost_send_boost_request_instance.to_dict()
# create an instance of BoostSendBoostRequest from a dict
boost_send_boost_request_from_dict = BoostSendBoostRequest.from_dict(boost_send_boost_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


