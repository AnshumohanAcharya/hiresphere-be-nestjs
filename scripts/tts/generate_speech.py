#!/usr/bin/env python3
"""
TTS Speech Generation Script
Called by NestJS to generate speech
Tries Coqui TTS first, falls back to pyttsx3 for MVP
"""
import sys
import json
import os
from pathlib import Path

def generate_speech_coqui(text, output_path, model_name="tts_models/en/ljspeech/glow-tts"):
    """Try to use Coqui TTS (requires Python 3.10+ for some dependencies)"""
    try:
        from TTS.api import TTS
        tts = TTS(model_name=model_name, progress_bar=False)
        tts.tts_to_file(text=text, file_path=output_path)
        return True
    except Exception as e:
        # Check if it's a Python version issue
        if "unsupported operand type" in str(e) or "|" in str(e):
            return False
        # Try fallback model
        try:
            tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
            tts.tts_to_file(text=text, file_path=output_path)
            return True
        except:
            return False

def generate_speech_pyttsx3(text, output_path):
    """Fallback to pyttsx3 (works with Python 3.9+)"""
    try:
        import pyttsx3
        import wave
        import pyaudio
        import tempfile
        
        # pyttsx3 doesn't directly save to file, so we use a workaround
        # For macOS, we can use the 'say' command as a better fallback
        return False  # Will use system command instead
    except:
        return False

def generate_speech_system(text, output_path):
    """Use macOS 'say' command as fallback (works on macOS)"""
    try:
        import subprocess
        
        # Use macOS 'say' command to generate audio
        # Convert to WAV format
        temp_file = output_path.replace('.wav', '_temp.aiff')
        result = subprocess.run(
            ['say', '-v', 'Samantha', '-o', temp_file, text],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0 and os.path.exists(temp_file):
            # Convert AIFF to WAV using ffmpeg (more common than sox)
            try:
                # Try to convert using ffmpeg
                subprocess.run(
                    ['ffmpeg', '-i', temp_file, '-y', output_path],
                    check=True,
                    capture_output=True,
                    timeout=10
                )
                os.remove(temp_file)
                return True
            except FileNotFoundError:
                # ffmpeg not found, try sox
                try:
                    subprocess.run(
                        ['sox', temp_file, output_path],
                        check=True,
                        capture_output=True,
                        timeout=10
                    )
                    os.remove(temp_file)
                    return True
                except FileNotFoundError:
                    # Neither ffmpeg nor sox available
                    # Try using soundfile library (more reliable than aifc which was removed in Python 3.13+)
                    try:
                        import soundfile as sf
                        
                        # Read AIFF file
                        data, samplerate = sf.read(temp_file)
                        # Write as WAV file
                        sf.write(output_path, data, samplerate, format='WAV')
                        
                        os.remove(temp_file)
                        return True
                    except ImportError as e:
                        # soundfile not available
                        print(f"soundfile not available: {e}", file=sys.stderr)
                        # soundfile not available, try aifc (Python < 3.13)
                        try:
                            import aifc
                            import wave
                            
                            with aifc.open(temp_file, 'r') as aiff_file:
                                frames = aiff_file.getnframes()
                                sample_rate = aiff_file.getframerate()
                                channels = aiff_file.getnchannels()
                                sample_width = aiff_file.getsampwidth()
                                data = aiff_file.readframes(frames)
                                
                                with wave.open(output_path, 'w') as wav_file:
                                    wav_file.setnchannels(channels)
                                    wav_file.setsampwidth(sample_width)
                                    wav_file.setframerate(sample_rate)
                                    wav_file.writeframes(data)
                            
                            os.remove(temp_file)
                            return True
                        except (ImportError, AttributeError):
                            # aifc not available (Python 3.13+) or failed
                            # Last resort: just use the AIFF file (won't work in browsers)
                            if os.path.exists(temp_file):
                                os.rename(temp_file, output_path.replace('.wav', '.aiff'))
                                return True
                    except Exception as e:
                        # soundfile conversion failed - log the error
                        print(f"soundfile conversion failed: {e}", file=sys.stderr)
                        import traceback
                        traceback.print_exc(file=sys.stderr)
                        # Don't fall back to AIFF - return False so we know conversion failed
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                        return False
            except Exception as e:
                # Conversion failed, try soundfile or aifc
                try:
                    import soundfile as sf
                    data, samplerate = sf.read(temp_file)
                    sf.write(output_path, data, samplerate, format='WAV')
                    os.remove(temp_file)
                    return True
                except ImportError:
                    try:
                        import aifc
                        import wave
                        with aifc.open(temp_file, 'r') as aiff_file:
                            frames = aiff_file.getnframes()
                            sample_rate = aiff_file.getframerate()
                            channels = aiff_file.getnchannels()
                            sample_width = aiff_file.getsampwidth()
                            data = aiff_file.readframes(frames)
                            with wave.open(output_path, 'w') as wav_file:
                                wav_file.setnchannels(channels)
                                wav_file.setsampwidth(sample_width)
                                wav_file.setframerate(sample_rate)
                                wav_file.writeframes(data)
                        os.remove(temp_file)
                        return True
                    except (ImportError, AttributeError, Exception) as e2:
                        # If all else fails, return False
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                        return False
        return False
    except Exception as e:
        return False

def generate_speech(text, output_path, model_name="tts_models/en/ljspeech/glow-tts"):
    """Main function that tries multiple TTS methods"""
    try:
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:
            Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Try Coqui TTS first (best quality)
        if generate_speech_coqui(text, output_path, model_name):
            if os.path.exists(output_path):
                return {
                    "success": True,
                    "path": output_path,
                    "size": os.path.getsize(output_path),
                    "method": "coqui"
                }
        
        # Fallback to system TTS (macOS 'say' command)
        if sys.platform == 'darwin':  # macOS
            if generate_speech_system(text, output_path):
                # The function should now always produce a .wav file
                if os.path.exists(output_path):
                    return {
                        "success": True,
                        "path": output_path,
                        "size": os.path.getsize(output_path),
                        "method": "system"
                    }
                # If somehow we still have an AIFF file, log a warning
                aiff_path = output_path.replace('.wav', '.aiff')
                if os.path.exists(aiff_path):
                    return {
                        "success": True,
                        "path": aiff_path,
                        "size": os.path.getsize(aiff_path),
                        "method": "system",
                        "warning": "AIFF format generated - browser may not support this"
                    }
        
        return {
            "success": False,
            "error": "All TTS methods failed. Please ensure Coqui TTS is properly installed or system TTS is available."
        }
        
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python generate_speech.py <text> <output_path> [model_name]"
        }))
        sys.exit(1)
    
    text = sys.argv[1]
    output_path = sys.argv[2]
    model = sys.argv[3] if len(sys.argv) > 3 else "tts_models/en/ljspeech/glow-tts"
    
    result = generate_speech(text, output_path, model)
    print(json.dumps(result))
    
    sys.exit(0 if result["success"] else 1)

