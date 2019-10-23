using UnityEngine;

public class CameraControl : MonoBehaviour
{
    public float mouseSpeed = 1.0f;
    public float rollSpeed = 1.0f;
    public float moveSpeed = 10.0f;
    public float zoomFov = 15.0f;
    private Camera _myCamera;
    private float defaultFov;
    
    void Start()
    {
        _myCamera = GetComponent<Camera>();
        defaultFov = _myCamera.fieldOfView;
    }
    
    void Update()
    {
        var mouseX = Input.GetAxis("Mouse X");
        var mouseY = Input.GetAxis("Mouse Y");
        var walkForward = Input.GetAxis("Vertical");
        var walkRight   = Input.GetAxis("Horizontal");
        var roll = Input.GetButton("Fire2");

        if (Mathf.Abs(mouseX) > float.Epsilon)
        {
            if (roll)
            {
                _myCamera.transform.Rotate(Vector3.forward, mouseX * mouseSpeed, Space.Self);
            }
            else
            {
                _myCamera.transform.Rotate(Vector3.up, mouseX * mouseSpeed, Space.World);
            }
        }
        
        if (Mathf.Abs(mouseY) > float.Epsilon)
        {
            //var axis = Vector3.Cross(Vector3.down, _myCamera.transform.forward);
            //_myCamera.transform.Rotate(axis, mouseY * mouseSpeed, Space.World);
            _myCamera.transform.Rotate(Vector3.left, mouseY * mouseSpeed, Space.Self);
        }

        if (Input.GetButton("Zoom"))
        {
            _myCamera.fieldOfView = zoomFov;
        }
        else
        {
            _myCamera.fieldOfView = defaultFov;
        }

        if (Mathf.Abs(walkForward) > float.Epsilon || Mathf.Abs(walkRight) > float.Epsilon)
        {
            var move = walkForward * Vector3.forward 
                       + walkRight * Vector3.right;
            
            move = _myCamera.transform.localToWorldMatrix * move;
            move -= Vector3.up * (Vector3.Dot(Vector3.up, move));
            _myCamera.transform.localPosition += Time.deltaTime * moveSpeed * move.normalized;
        }
    }
}
