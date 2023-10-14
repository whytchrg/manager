
import numpy as np
import cv2

import math

# add Metadata Version

window = 'Analysis'
color = (0,0,255)
stroke = 2

# Initialize the parameters
objectnessThreshold = 0.5 # Objectness threshold
confThreshold = 0.5       # Confidence threshold
nmsThreshold = 0.4        # Non-maximum suppression threshold
inpWidth = 416            # Width of network's input image
inpHeight = 416           # Height of network's input image

classesFile = "coco.names"
classes = None
with open(classesFile, 'rt') as f:
    classes = f.read().rstrip('\n').split('\n')

modelConfiguration = "yolov3.cfg"
modelWeights = "yolov3.weights"

net = cv2.dnn.readNetFromDarknet(modelConfiguration, modelWeights)
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)

def getOutputsNames(net):
    layersNames = net.getLayerNames()
    return [layersNames[i - 1] for i in net.getUnconnectedOutLayers()]

# Draw the predicted bounding box
def drawPred(classId, conf, left, top, right, bottom, frame):
    # Draw a bounding box.
    cv2.rectangle(frame, (left, top), (right, bottom), (255, 178, 50), 3)

    label = '%.2f' % conf

    # Get the label for the class name and its confidence
    if classes:
        assert(classId < len(classes))
        label = '%s:%s' % (classes[classId], label)

    #Display the label at the top of the bounding box
    labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
    top = max(top, labelSize[1])
    cv2.rectangle(frame, (left, top - round(labelSize[1])), (left + round(labelSize[0]), top + baseLine), (255, 255, 255), cv2.FILLED)
    cv2.putText(frame, label, (left, top), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,0), 1)

def postprocess(frame, outs):
    frameHeight = frame.shape[0]
    frameWidth = frame.shape[1]

    classIds = []
    confidences = []
    boxes = []
    # Scan through all the bounding boxes output from the network and keep only the
    # ones with high confidence scores. Assign the box's class label as the class with the highest score.
    classIds = []
    confidences = []
    boxes = []
    for out in outs:
        for detection in out:
            if detection[4] > objectnessThreshold :
                scores = detection[5:]
                classId = np.argmax(scores)
                confidence = scores[classId]
                if confidence > confThreshold:
                    center_x = int(detection[0] * frameWidth)
                    center_y = int(detection[1] * frameHeight)
                    width = int(detection[2] * frameWidth)
                    height = int(detection[3] * frameHeight)
                    left = int(center_x - width / 2)
                    top = int(center_y - height / 2)
                    classIds.append(classId)
                    confidences.append(float(confidence))
                    boxes.append([left, top, width, height])

    # Perform non maximum suppression to eliminate redundant overlapping boxes with
    # lower confidences.
    indices = cv2.dnn.NMSBoxes(boxes, confidences, confThreshold, nmsThreshold)
    for i in indices:
        i = i
        box = boxes[i]
        left = box[0]
        top = box[1]
        width = box[2]
        height = box[3]
        drawPred(classIds[i], confidences[i], left, top, left + width, top + height, frame)

def detect(frame):
    blob = cv2.dnn.blobFromImage(frame, 1/255, (inpWidth, inpHeight), [0,0,0], 1, crop=False)

    net.setInput(blob)

    outs = net.forward(getOutputsNames(net))

    postprocess(frame, outs)
    t, _ = net.getPerfProfile()
    label = 'Inference time: %.2f ms' % (t * 1000.0 / cv2.getTickFrequency())
    cv2.putText(frame, label, (0, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255))

    return frame

def showEnter(img):
    k = 0
    while k != 13:
        cv2.imshow(window, img)
        cv2.waitKey(0)

class Analysis:

    def __init__(self, image):

        h, w = image.shape[:2]
        area = 200000

        if w > h:
            width = math.sqrt(area * (w/h))
            height = math.sqrt(area * (h/w))
        else:
            width = math.sqrt(area * (w/h))
            height = math.sqrt(area * (h/w))

        height = np.round(height).astype(int)
        width = np.round(width).astype(int)
        size = (width, height)

        self.image = cv2.resize(image, size, cv2.INTER_CUBIC)
        self.hls = cv2.cvtColor(self.image, cv2.COLOR_BGR2HLS)

        self.gray = cv2.cvtColor(self.image, cv2.COLOR_RGBA2GRAY)

        self.height = self.image.shape[0]
        self.width = self.image.shape[1]
        self.pixel = (self.width * self.height)

        # return
        # rating (view, date analysis)
        # category switch or fluent
        # tags and or image analysis

    def get_hue(self):
        hue = cv2.sumElems(self.hls)[0]
        hue_average = hue /  self.pixel
        return hue_average

    def get_lightness(self):
        lightnes = cv2.sumElems(self.hls)[1]
        lightnes_average = lightnes /  self.pixel
        return lightnes_average

    def get_saturation(self):
        saturation = cv2.sumElems(self.hls)[2]
        saturation_average = saturation /  self.pixel
        return saturation_average

    def test(self):
        #cv2.namedWindow(window, cv2.WINDOW_AUTOSIZE)

        # cv2.imshow(window, self.gray)
        # cv2.waitKey(0)

        img = self.gray

        contrast =  self.gray.std()
        print(contrast)

        b,g,r = cv2.split(self.image)

        # cv2.imshow(window, b)
        # cv2.waitKey(0)
        contrast_b =  b.std()
        print(contrast_b)

        if contrast_b > contrast:
            contrast = contrast_b
            img = b

        # cv2.imshow(window, g)
        # cv2.waitKey(0)
        contrast_g =  g.std()
        print(contrast_g)

        if contrast_g > contrast:
            contrast = contrast_g
            img = g

        # cv2.imshow(window, r)
        # cv2.waitKey(0)
        contrast_r =  r.std()
        print(contrast_r)

        if contrast_r > contrast:
            contrast = contrast_r
            img = r

        img_blur = cv2.medianBlur(img, 7)
        # cv2.imshow(window, img_blur)
        # cv2.waitKey(0)
        edges = cv2.Canny(img_blur, 50, 200)
        cv2.imshow(window, edges)
        cv2.waitKey(0)

        linesP = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=70)
        img_linesP = np.copy(self.image)
        if linesP is not None:
            for line in linesP:
                x1, y1, x2, y2 = line[0]
                cv2.line(img_linesP, (x1, y1), (x2, y2), (255, 0, 0), 3)
        cv2.imshow(window, img_linesP)
        cv2.waitKey(0)

        circles = cv2.HoughCircles(img_blur, cv2.HOUGH_GRADIENT, 1, 50, param1=450, param2=40, minRadius=5, maxRadius=400)
        # Draw detected circles
        img_circles = np.copy(self.image)
        if circles is not None:
            circles = np.uint16(np.around(circles))
            for i in circles[0, :]:
                # Draw outer circle
                cv2.circle(img_circles, (i[0], i[1]), i[2], (0, 255, 0), 2)
                # Draw inner circle
                cv2.circle(img_circles, (i[0], i[1]), 2, (0, 0, 255), 3)
        cv2.imshow(window, img_circles)
        cv2.waitKey(0)

        # yolov = np.copy(self.image)

        # yolov = detect(yolov)

        # cv2.imshow(window, yolov)
        # cv2.waitKey(0)




        #cv2.destroyWindow(window)

        # linesP = cv2.HoughLinesP(edges, 200, np.pi / 180, 50, None, 50, 10)
        # img_linesP = np.copy(self.image)
        # if linesP is not None:
        #     for i in range(0, len(linesP)):
        #         l = linesP[i][0]
        #         cv2.line(img_linesP, (l[0], l[1]), (l[2], l[3]), (0,0,255), 3, cv2.LINE_AA)
        # showEnter(img_lines, 'HoughLinesP')
