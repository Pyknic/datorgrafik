using UnityEngine;

public class CameraControl : MonoBehaviour
{
    public float mouseSpeed = 1.0f;
    public float moveSpeed = 10.0f;
    private Camera _myCamera;
    
    void Start()
    {
        _myCamera = GetComponent<Camera>();
    }
    
    void Update()
    {
        var mouseX = Input.GetAxis("Mouse X");
        var mouseY = Input.GetAxis("Mouse Y");
        var walkForward = Input.GetAxis("Vertical");
        var walkRight   = Input.GetAxis("Horizontal");

        if (Mathf.Abs(mouseX) > float.Epsilon)
        {
            _myCamera.transform.Rotate(Vector3.up, mouseX * mouseSpeed, Space.World);
        }
            
        if (Mathf.Abs(mouseY) > float.Epsilon)
        {
            _myCamera.transform.Rotate(Vector3.left, mouseY * mouseSpeed);
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
